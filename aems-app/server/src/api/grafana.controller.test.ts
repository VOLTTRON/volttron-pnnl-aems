import { GrafanaController } from "./grafana.controller";
import { AppConfigService } from "@/app.config";
import { Request, Response } from "express";

function makeConfig(configPath: string | null = null): AppConfigService {
  return {
    grafana: {
      configPath,
      path: "/grafana",
      url: "https://grafana.local",
    },
    volttron: {
      campus: "pnnl",
      building: "bsf",
    },
  } as unknown as AppConfigService;
}

function makeReq(): Request {
  return {
    get: jest.fn().mockReturnValue(undefined),
    socket: { remoteAddress: "127.0.0.1" },
    path: "/api/grafana/dashboard/x/y/z",
  } as unknown as Request;
}

function makeRes(): Response {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
    redirect: jest.fn(),
  } as unknown as Response;
  (res.status as jest.Mock).mockReturnValue(res);
  (res.json as jest.Mock).mockReturnValue(res);
  (res.redirect as jest.Mock).mockReturnValue(res);
  return res;
}

const USER = { id: "u1", email: "user@example.com" } as unknown as Express.User;

describe("GrafanaController", () => {
  // scenario: dashboard-configs-reread
  it("re-reads dashboard configs before every lookup", async () => {
    const ctrl = new GrafanaController(makeConfig(null));
    const executeSpy = jest.spyOn(ctrl, "execute").mockResolvedValue(undefined);

    await ctrl.dashboard(makeReq(), makeRes(), USER, "x", "y", "z");
    await ctrl.dashboard(makeReq(), makeRes(), USER, "x", "y", "z");

    expect(executeSpy).toHaveBeenCalledTimes(2);
  });

  it("clears the config list at the start of execute(), so a reread does not stack", async () => {
    const ctrl = new GrafanaController(makeConfig(null));
    // configPath null → execute() returns before populating anything; the
    // clear-at-start step is still observable through this.configs.
    (ctrl as unknown as { configs: unknown[] }).configs = [{ existing: true } as unknown];
    await ctrl.execute();
    expect((ctrl as unknown as { configs: unknown[] }).configs).toEqual([]);
  });
});
