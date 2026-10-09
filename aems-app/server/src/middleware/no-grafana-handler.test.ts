jest.mock("@auth/express", () => ({
  getSession: jest.fn(),
  ExpressAuth: jest.fn(),
}));

jest.mock("@auth/core/errors", () => ({
  AuthError: class AuthError extends Error {},
}));

jest.mock("@/auth/authjs/authjs.config", () => ({
  buildConfig: jest.fn(() => ({})),
}));

import { AppConfigService } from "@/app.config";
import { GrafanaController } from "@/api/grafana.controller";
import { MiddlewareModule } from "./middleware.module";
import { MiddlewareConsumer } from "@nestjs/common";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Request, Response } from "express";

interface ApplyCall {
  routes: unknown[];
}

function makeConsumer(): { consumer: MiddlewareConsumer; calls: ApplyCall[] } {
  const calls: ApplyCall[] = [];
  const consumer = {
    apply: () => ({
      forRoutes: (...routes: unknown[]) => {
        calls.push({ routes });
        return consumer;
      },
    }),
  } as unknown as MiddlewareConsumer;
  return { consumer, calls };
}

function makeConfig(configPath: string): AppConfigService {
  return {
    grafana: {
      configPath,
      path: "/gdb",
      url: "http://grafana.example.com",
    },
    volttron: { campus: "pnnl", building: "sef" },
    instanceType: "primary",
  } as unknown as AppConfigService;
}

function makeReq(): Request {
  return {
    get: () => undefined,
    socket: { remoteAddress: "127.0.0.1" },
    path: "/",
  } as unknown as Request;
}

function makeRes() {
  const res: Partial<Response> & { statusCode?: number; redirectedTo?: string; body?: unknown } = {};
  res.status = jest.fn().mockImplementation((n: number) => {
    res.statusCode = n;
    return res as Response;
  });
  res.json = jest.fn().mockImplementation((b: unknown) => {
    res.body = b;
    return res as Response;
  });
  res.redirect = jest.fn().mockImplementation((...args: unknown[]) => {
    res.redirectedTo = String(args[args.length - 1]);
    return res as Response;
  });
  return res as Response & { statusCode?: number; redirectedTo?: string };
}

// scenario: dashboard-redirect-no-handler
describe("the dashboard redirect; no `/grafana` handler is registered", () => {
  describe("MiddlewareModule.configure", () => {
    it("registers nothing whose route begins with `grafana`", () => {
      const { consumer, calls } = makeConsumer();
      new MiddlewareModule().configure(consumer);

      const routeStrings = calls.flatMap((c) =>
        c.routes.map((r) => {
          if (typeof r === "string") return r;
          if (r && typeof r === "object" && "path" in r) {
            return String((r as { path: unknown }).path);
          }
          return JSON.stringify(r);
        }),
      );

      for (const route of routeStrings) {
        expect(route).not.toMatch(/^grafana/);
      }
    });
  });

  describe("GrafanaController.dashboard for a signed-in user", () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), "grafana-no-handler-"));
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it("redirects a signed-in user to the dashboard's URL", async () => {
      await writeFile(
        join(tempDir, "pnnl--sef_dashboard_urls.json"),
        JSON.stringify({
          "RTU Overview - RTU1": "http://grafana.example.com/d/rtu1",
        }),
        "utf-8",
      );
      const controller = new GrafanaController(makeConfig(tempDir));
      const res = makeRes();
      await controller.dashboard(
        makeReq(),
        res,
        { id: "u1", email: "u1@example.com" } as Express.User,
        "pnnl",
        "sef",
        "rtu1",
      );
      expect(res.redirectedTo).toBe("http://grafana.example.com/d/rtu1");
    });

    it("returns 404 when the config has no matching dashboard", async () => {
      const controller = new GrafanaController(makeConfig(tempDir));
      const res = makeRes();
      await controller.dashboard(
        makeReq(),
        res,
        { id: "u1", email: "u1@example.com" } as Express.User,
        "pnnl",
        "sef",
        "missing",
      );
      expect(res.statusCode).toBe(404);
    });
  });
});
