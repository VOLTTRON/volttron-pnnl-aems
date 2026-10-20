jest.mock("undici", () => ({
  Agent: jest.fn().mockImplementation(() => ({ destroy: jest.fn().mockResolvedValue(undefined) })),
  fetch: jest.fn(),
}));

import { fetch } from "undici";
import { AppConfigService } from "@/app.config";
import { VolttronService } from "./volttron.service";

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

function service(mocked = false, apiUrl = "https://edge", platform = "volttron1") {
  return new VolttronService({
    volttron: { ca: "", mocked },
    service: {
      config: { timeout: 1000, authUrl: "https://edge/authenticate", apiUrl, platform, username: "u", password: "p", verbose: false },
    },
  } as unknown as AppConfigService);
}

describe("VolttronService", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  // scenario: volttron-rpc-via-vui
  describe("an agent RPC", () => {
    it("is a POST to the VUI rpc endpoint with the payload as the data argument and a bearer token", async () => {
      fetchMock.mockResolvedValue(response(200, true));
      await expect(service().makeApiCall("manager.rtu1", "set_holidays", "token", { Labor: {} })).resolves.toBe(true);
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

    it("still works when the configured URL names the retired /gs gateway", () => {
      expect(service(false, "https://edge/gs").rpcUrl("manager.rtu1", "set_holidays")).toBe(RPC_URL);
    });

    it("resolves to whatever the agent returned", async () => {
      fetchMock.mockResolvedValue(response(200, { ok: 1 }));
      await expect(service().makeApiCall("manager.rtu1", "set_holidays", "token", {})).resolves.toEqual({ ok: 1 });
    });
  });

  // scenario: volttron-call-retried
  describe("a call VOLTTRON could not complete", () => {
    it("is tried three times, 1 s then 2 s apart, before it fails", async () => {
      fetchMock.mockResolvedValue(response(502, "bad gateway", "text/plain"));
      const call = service().makeApiCall("manager.rtu1", "set_holidays", "token", {});
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
      const call = service().makeApiCall("manager.rtu1", "set_holidays", "token", {});
      await jest.advanceTimersByTimeAsync(1000);
      await expect(call).resolves.toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it.each([
      ["a server error", response(500, "boom", "text/plain"), /HTTP 500/],
      ["a non-JSON response", response(200, "<html>", "text/html"), /expected JSON/],
    ])("fails on %s after retrying", async (_, reply, error) => {
      fetchMock.mockResolvedValue(reply);
      const call = service().makeApiCall("manager.rtu1", "set_holidays", "token", {});
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
      const call = service().makeApiCall("manager.rtu1", "set_holidays", "token", {});
      const failed = expect(call).rejects.toThrow(error);
      await jest.advanceTimersByTimeAsync(10_000);
      await failed;
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  // scenario: mocked-sends-nothing
  it("with VOLTTRON_MOCKED on, sends no request and every call succeeds", async () => {
    const volttron = service(true);
    const token = await volttron.makeAuthCall();
    await expect(volttron.makeApiCall("manager.rtu1", "set_holidays", token, {})).resolves.toBe(true);
    await expect(volttron.makeApiCall("agent.ilc", "update_configurations", token, {})).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
