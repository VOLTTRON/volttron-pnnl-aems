jest.mock("undici", () => ({
  Agent: jest.fn().mockImplementation(() => ({ destroy: jest.fn().mockResolvedValue(undefined) })),
  fetch: jest.fn(),
}));

import { Logger } from "@nestjs/common";
import { fetch } from "undici";
import { AppConfigService } from "@/app.config";
import { AgentFailureError, PlatformUnansweredError, VolttronHttpError, VolttronService, type VolttronSession } from "./volttron.service";

const fetchMock = fetch as unknown as jest.Mock;

const response = (status: number, body: unknown, contentType = "application/json") => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: String(status),
  headers: { get: () => contentType },
  text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  json: () => Promise.resolve(body),
});

const RPC_URL = "https://edge/vui/platforms/volttron1/agents/manager.rtu1/rpc/set_holidays";
const GS_URL = "https://edge/gs";
const VUI_PROBE = "https://edge/vui";
const vui: VolttronSession = { token: "token", api: "vui" };
const gs: VolttronSession = { token: "token", api: "gs" };

function service(mocked = false, apiUrl = "https://edge", platform = "volttron1", verbose = false) {
  return new VolttronService({
    volttron: { ca: "", mocked },
    service: {
      config: { timeout: 1000, authUrl: "https://edge/authenticate", apiUrl, platform, username: "u", password: "p", verbose },
    },
  } as unknown as AppConfigService);
}

/** Every argument passed to any Logger method, as text, until the returned spies are restored. */
function captureLogs() {
  const lines: string[] = [];
  const spies = (["log", "warn", "error", "debug", "verbose", "fatal"] as const).map((level) =>
    jest.spyOn(Logger.prototype, level).mockImplementation((...args: unknown[]) => {
      lines.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a) ?? String(a))).join(" "));
    }),
  );
  return { lines, restore: () => spies.forEach((s) => s.mockRestore()) };
}

describe("VolttronService", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  // scenario: volttron-rpc-via-vui
  describe("an agent RPC through VUI", () => {
    it("is a POST to the VUI rpc endpoint with the payload as the data argument and a bearer token", async () => {
      fetchMock.mockResolvedValue(response(200, true));
      await expect(service().makeApiCall("manager.rtu1", "set_holidays", vui, { Labor: {} })).resolves.toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, { method: string; body: string; headers: Record<string, string> }];
      expect(url).toBe(RPC_URL);
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual({ data: { Labor: {} } });
      expect(init.headers).toMatchObject({ "Content-Type": "application/json", Authorization: "Bearer token" });
    });

    it("escapes the platform, identity and method in the path", () => {
      expect(service(false, "https://edge/", "my platform").rpcUrl("agent/ilc", "a.b")).toBe(
        "https://edge/vui/platforms/my%20platform/agents/agent%2Filc/rpc/a.b",
      );
    });

    it("still works when the configured URL names /gs", () => {
      expect(service(false, "https://edge/gs").rpcUrl("manager.rtu1", "set_holidays")).toBe(RPC_URL);
    });

    it("resolves to whatever the agent returned", async () => {
      fetchMock.mockResolvedValue(response(200, { ok: 1 }));
      await expect(service().makeApiCall("manager.rtu1", "set_holidays", vui, {})).resolves.toEqual({ ok: 1 });
    });
  });

  // scenario: volttron-api-detected
  describe("the push's one API detection, after /authenticate", () => {
    const AUTH = "https://edge/authenticate";

    it("GETs <base>/vui with a bearer header and sends subsequent calls through VUI on 2xx", async () => {
      fetchMock
        .mockResolvedValueOnce(response(200, { access_token: "abc" })) // POST /authenticate
        .mockResolvedValueOnce(response(200, { endpoints: [] })) //       GET  /vui
        .mockResolvedValueOnce(response(200, true)); //                    POST /vui/.../rpc/...
      const session = await service().makeAuthCall();
      expect(session).toEqual({ token: "abc", api: "vui" });
      // The probe is a GET with the bearer, exactly once per push.
      const [authUrl] = fetchMock.mock.calls[0] as [string, { method: string }];
      const [probeUrl, probeInit] = fetchMock.mock.calls[1] as [string, { method: string; headers: Record<string, string> }];
      expect(authUrl).toBe(AUTH);
      expect(probeUrl).toBe(VUI_PROBE);
      expect(probeInit.method).toBe("GET");
      expect(probeInit.headers).toMatchObject({ Authorization: "Bearer abc" });
      // The next RPC goes through VUI.
      await expect(service().makeApiCall("manager.rtu1", "set_holidays", session, {})).resolves.toBe(true);
      const [rpcUrl] = fetchMock.mock.calls[2] as [string];
      expect(rpcUrl).toBe(RPC_URL);
    });

    it("sends subsequent calls through /gs on 404", async () => {
      fetchMock
        .mockResolvedValueOnce(response(200, { access_token: "abc" }))
        .mockResolvedValueOnce(response(404, "not found", "text/plain"));
      const session = await service().makeAuthCall();
      expect(session).toEqual({ token: "abc", api: "gs" });
    });

    it.each([
      ["a server error", response(500, "boom", "text/plain"), /HTTP 500/],
      ["an unauthorized probe", response(401, "nope"), /HTTP 401/],
      ["a redirect", response(302, "see other"), /HTTP 302/],
    ])("fails the push on %s", async (_, reply, error) => {
      fetchMock.mockResolvedValueOnce(response(200, { access_token: "abc" })).mockResolvedValueOnce(reply);
      await expect(service().makeAuthCall()).rejects.toThrow(error);
    });

    it("strips a trailing /gs from the configured base before probing", async () => {
      fetchMock.mockResolvedValueOnce(response(200, { access_token: "abc" })).mockResolvedValueOnce(response(200, {}));
      await service(false, "https://edge/gs").makeAuthCall();
      const [probeUrl] = fetchMock.mock.calls[1] as [string];
      expect(probeUrl).toBe(VUI_PROBE);
    });
  });

  // scenario: volttron-rpc-via-gs
  describe("an agent RPC through /gs", () => {
    it("is a JSON-RPC 2.0 POST to <base>/gs with identity, method, token and payload in params", async () => {
      fetchMock.mockResolvedValue(response(200, { jsonrpc: "2.0", id: "manager.rtu1", result: { ok: 1 } }));
      await expect(service().makeApiCall("manager.rtu1", "set_holidays", gs, { Labor: {} })).resolves.toEqual({ ok: 1 });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, { method: string; body: string; headers: Record<string, string> }];
      expect(url).toBe(GS_URL);
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual({
        jsonrpc: "2.0",
        id: "manager.rtu1",
        method: "set_holidays",
        params: { authentication: "token", data: { Labor: {} } },
      });
      expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
      // No bearer header on /gs: the token travels in params.
      expect(init.headers.Authorization).toBeUndefined();
    });

    it.each([
      ["a missing result (just id)", { jsonrpc: "2.0", id: "manager.rtu1" }],
      ["a missing result (error field)", { jsonrpc: "2.0", id: "manager.rtu1", error: { code: -1, message: "nope" } }],
      ["a string result", { jsonrpc: "2.0", id: "manager.rtu1", result: "agent not found" }],
    ])("fails on the first try when the response has %s", async (_, body) => {
      fetchMock.mockResolvedValue(response(200, body));
      const call = service().makeApiCall("manager.rtu1", "set_holidays", gs, {});
      const failed = expect(call).rejects.toThrow(/agent manager\.rtu1 reported failure/);
      await jest.advanceTimersByTimeAsync(10_000);
      await failed;
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("retries 5xx and non-JSON responses like VUI does", async () => {
      fetchMock
        .mockResolvedValueOnce(response(502, "bad gateway", "text/plain"))
        .mockResolvedValueOnce(response(200, { jsonrpc: "2.0", id: "manager.rtu1", result: true }));
      const call = service().makeApiCall("manager.rtu1", "set_holidays", gs, {});
      await jest.advanceTimersByTimeAsync(1000);
      await expect(call).resolves.toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  // scenario: volttron-call-retried
  describe("a call VOLTTRON could not complete", () => {
    it("is tried three times, 1 s then 2 s apart, before it fails", async () => {
      fetchMock.mockResolvedValue(response(502, "bad gateway", "text/plain"));
      const call = service().makeApiCall("manager.rtu1", "set_holidays", vui, {});
      const failed = expect(call).rejects.toThrow(/HTTP 502/);
      await jest.advanceTimersByTimeAsync(0);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(999);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      await jest.advanceTimersByTimeAsync(1999);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      await jest.advanceTimersByTimeAsync(1);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      await jest.advanceTimersByTimeAsync(10_000);
      await failed;
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("succeeds on a later try", async () => {
      fetchMock.mockResolvedValueOnce(response(503, "busy", "text/plain")).mockResolvedValue(response(200, true));
      const call = service().makeApiCall("manager.rtu1", "set_holidays", vui, {});
      await jest.advanceTimersByTimeAsync(1000);
      await expect(call).resolves.toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it.each([
      ["a server error", response(500, "boom", "text/plain"), /HTTP 500/],
      ["a non-JSON response", response(200, "<html>", "text/html"), /expected JSON/],
    ])("fails on %s after retrying", async (_, reply, error) => {
      fetchMock.mockResolvedValue(reply);
      const call = service().makeApiCall("manager.rtu1", "set_holidays", vui, {});
      const failed = expect(call).rejects.toThrow(error);
      await jest.advanceTimersByTimeAsync(10_000);
      await failed;
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  // scenario: volttron-refusal-not-retried
  describe("a call VOLTTRON or the agent refused", () => {
    it.each([
      ["an expired token", response(401, { error: "Not Authorized" }), /HTTP 401/],
      ["a forbidden method", response(403, { error: "Forbidden" }), /HTTP 403/],
      ["a bad request", response(400, { error: "method not found" }), /HTTP 400/],
      ["the agent reporting failure", response(200, false), /agent manager\.rtu1 reported failure/],
    ])("fails at once on %s", async (_, reply, error) => {
      fetchMock.mockResolvedValue(reply);
      const call = service().makeApiCall("manager.rtu1", "set_holidays", vui, {});
      const failed = expect(call).rejects.toThrow(error);
      await jest.advanceTimersByTimeAsync(10_000);
      await failed;
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  // scenario: mid-push-no-answer-waits
  describe("a call the platform gives no answer to", () => {
    /** What undici's fetch rejects with when no HTTP answer arrives. */
    const noAnswer = (code: string) => Object.assign(new TypeError("fetch failed"), { cause: Object.assign(new Error(`connect ${code} 192.168.65.254:5410`), { code }) });

    it.each([["refused", "ECONNREFUSED"], ["reset", "ECONNRESET"], ["timed out", "UND_ERR_CONNECT_TIMEOUT"]])(
      "is tried three times, then fails as unanswered when the connection is %s, naming why",
      async (_, code) => {
        fetchMock.mockRejectedValue(noAnswer(code));
        const failed = service().makeApiCall("agent.ilc", "update_configurations", vui, {}).catch((e: Error) => e);
        await jest.advanceTimersByTimeAsync(10_000);
        const error = await failed;
        expect(error).toBeInstanceOf(PlatformUnansweredError);
        expect((error as Error).message).toContain(code);
        expect(fetchMock).toHaveBeenCalledTimes(3);
      },
    );

    it.each([
      ["a server error", response(502, "bad gateway", "text/plain"), VolttronHttpError],
      ["the agent's false", response(200, false), AgentFailureError],
    ])("is not what %s is: an answered call fails as before", async (_, reply, type) => {
      fetchMock.mockResolvedValue(reply);
      const failed = service().makeApiCall("agent.ilc", "update_configurations", vui, {}).catch((e: Error) => e);
      await jest.advanceTimersByTimeAsync(10_000);
      const error = await failed;
      expect(error).toBeInstanceOf(type);
      expect(error).not.toBeInstanceOf(PlatformUnansweredError);
    });
  });

  // scenario: volttron-api-logged
  describe("the API a push goes through", () => {
    let logs: ReturnType<typeof captureLogs>;
    beforeEach(() => (logs = captureLogs()));
    afterEach(() => logs.restore());

    it.each([
      ["VUI", response(200, {})],
      ["/gs", response(404, "not found", "text/plain")],
    ])("is logged with the base it was found at, verbose off: %s", async (api, probe) => {
      fetchMock.mockResolvedValueOnce(response(200, { access_token: "abc" })).mockResolvedValueOnce(probe);
      await service(false, "https://edge/gs").makeAuthCall();
      const named = logs.lines.filter((l) => l.includes(api) && l.includes("https://edge"));
      expect(named).toHaveLength(1);
      expect(named[0]).not.toContain("https://edge/gs");
    });

    it.each([
      ["VUI", "a server error", vui, response(500, "boom", "text/plain")],
      ["VUI", "a refused call", vui, response(401, { error: "Not Authorized" })],
      ["VUI", "an agent refusal", vui, response(200, false)],
      ["/gs", "a server error", gs, response(500, "boom", "text/plain")],
      ["/gs", "a refused call", gs, response(401, { error: "Not Authorized" })],
      ["/gs", "an agent refusal", gs, response(200, { jsonrpc: "2.0", id: "manager.rtu1", result: "agent not found" })],
    ])("is named in the error of a failed call through %s on %s", async (api, _, session, reply) => {
      fetchMock.mockResolvedValue(reply);
      const call = service().makeApiCall("manager.rtu1", "set_holidays", session, {});
      const failed = call.catch((e: Error) => e);
      await jest.advanceTimersByTimeAsync(10_000);
      expect(((await failed) as Error).message).toContain(api);
    });
  });

  // scenario: volttron-neither-api
  it("says neither API is served, naming both URLs, when /vui answered 404 and a /gs call answers 404", async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, { access_token: "abc" }))
      .mockResolvedValueOnce(response(404, "not found", "text/plain"))
      .mockResolvedValue(response(404, "not found", "text/plain"));
    const volttron = service(false, "https://edge/gs");
    const session = await volttron.makeAuthCall();
    const failed = volttron.makeApiCall("manager.rtu1", "set_holidays", session, {}).catch((e: Error) => e);
    await jest.advanceTimersByTimeAsync(10_000);
    const message = ((await failed) as Error).message;
    expect(message).toMatch(/neither/i);
    expect(message).toContain(VUI_PROBE);
    expect(message).toContain(GS_URL);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  // scenario: volttron-token-not-logged
  it("logs no line holding the access token, verbose on, through VUI and /gs", async () => {
    const TOKEN = "tok-3f9a1c77e0";
    const logs = captureLogs();
    try {
      for (const probe of [response(200, {}), response(404, "not found", "text/plain")]) {
        fetchMock
          .mockResolvedValueOnce(response(200, { access_token: TOKEN }))
          .mockResolvedValueOnce(probe)
          .mockResolvedValueOnce(response(502, "bad gateway", "text/plain"))
          .mockResolvedValueOnce(response(200, { jsonrpc: "2.0", id: "manager.rtu1", result: true }))
          .mockResolvedValueOnce(response(200, false));
        const volttron = service(false, "https://edge", "volttron1", true);
        const session = await volttron.makeAuthCall();
        expect(session.token).toBe(TOKEN);
        const ok = volttron.makeApiCall("manager.rtu1", "set_holidays", session, { Labor: {} }).catch(() => undefined);
        await jest.advanceTimersByTimeAsync(10_000);
        await ok;
        const refused = volttron.makeApiCall("manager.rtu1", "set_holidays", session, {}).catch(() => undefined);
        await jest.advanceTimersByTimeAsync(10_000);
        await refused;
      }
      expect(logs.lines.length).toBeGreaterThan(4);
      expect(logs.lines.filter((l) => l.includes(TOKEN))).toEqual([]);
    } finally {
      logs.restore();
    }
  });

  // scenario: mocked-sends-nothing
  it("with VOLTTRON_MOCKED on, sends no request and every call succeeds", async () => {
    const volttron = service(true);
    const session = await volttron.makeAuthCall();
    expect(session).toEqual({ token: "mocked_access_token", api: "vui" });
    await expect(volttron.makeApiCall("manager.rtu1", "set_holidays", session, {})).resolves.toBe(true);
    await expect(volttron.makeApiCall("agent.ilc", "update_configurations", session, {})).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
