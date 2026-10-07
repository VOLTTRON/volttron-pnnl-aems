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

function service(mocked = false) {
  return new VolttronService({
    volttron: { ca: "", mocked },
    service: { config: { timeout: 1000, authUrl: "https://edge/authenticate", apiUrl: "https://edge/jsonrpc", username: "u", password: "p", verbose: false } },
  } as unknown as AppConfigService);
}

describe("VolttronService", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  // scenario: volttron-call-retried
  describe("a call to VOLTTRON", () => {
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
      fetchMock.mockResolvedValueOnce(response(503, "busy", "text/plain")).mockResolvedValue(response(200, { result: { ok: true } }));
      const call = service().makeApiCall("manager.rtu1", "set_holidays", "token", {});
      await jest.advanceTimersByTimeAsync(1000);
      await expect(call).resolves.toEqual({ result: { ok: true } });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it.each([
      ["a non-2xx response", response(500, "boom", "text/plain"), /HTTP 500/],
      ["a non-JSON response", response(200, "<html>", "text/html"), /expected JSON/],
      ["a missing result", response(200, { jsonrpc: "2.0" }), /Failed Volttron API set_holidays call\./],
      ["a string result", response(200, { result: "no such method" }), /Failed Volttron API set_holidays call: /],
    ])("fails on %s", async (_, reply, error) => {
      fetchMock.mockResolvedValue(reply);
      const call = service().makeApiCall("manager.rtu1", "set_holidays", "token", {});
      const failed = expect(call).rejects.toThrow(error);
      await jest.advanceTimersByTimeAsync(10_000);
      await failed;
    });
  });

  // scenario: mocked-sends-nothing
  it("with VOLTTRON_MOCKED on, sends no request and every call succeeds", async () => {
    const volttron = service(true);
    const token = await volttron.makeAuthCall();
    await expect(volttron.makeApiCall("manager.rtu1", "set_holidays", token, {})).resolves.toMatchObject({ result: {} });
    await expect(volttron.makeApiCall("agent.ilc", "update_configurations", token, {})).resolves.toMatchObject({ result: {} });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
