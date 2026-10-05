jest.mock("http", () => ({ request: jest.fn() }));
jest.mock("https", () => ({ request: jest.fn() }));

import * as http from "http";
import { RoleType } from "@local/common";
import { Request, Response } from "express";
import { AppConfigService } from "@/app.config";
import { ExtRewriteMiddleware } from "./ext.middleware";

const forwarded = http.request as jest.MockedFunction<typeof http.request>;

const ENV: Record<string, string> = {
  EXT_MAP_PATH: "/ext/map",
  EXT_MAP_ROLE: "user",
  EXT_MAP_AUTHORIZED: "http://map",
  EXT_MAP_UNAUTHORIZED: "https://host.example",
  EXT_WIKI_PATH: "/ext/wiki",
  EXT_WIKI_ROLE: "admin",
  EXT_WIKI_AUTHORIZED: "http://wiki",
  // No role: nothing to check the caller against.
  EXT_OPEN_PATH: "/ext/open",
  EXT_OPEN_AUTHORIZED: "http://open",
};

/** The middleware as the environment configures it, handling one request; whether it forwarded. */
function handle(url: string, roles?: (typeof RoleType.User)[]) {
  const req = {
    url,
    originalUrl: url,
    method: "GET",
    headers: {},
    user: roles ? { roles } : undefined,
    pipe: jest.fn(),
  } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next = jest.fn();
  forwarded.mockReset();
  forwarded.mockReturnValue({ on: jest.fn().mockReturnThis() } as unknown as http.ClientRequest);
  new ExtRewriteMiddleware(new AppConfigService()).use(req, res, next);
  return { forwarded: forwarded.mock.calls.length > 0, res, next };
}

// scenario: ext-checks-roles-first
describe("/ext/ forwards only after the caller's roles are checked", () => {
  const saved: Record<string, string | undefined> = {};
  beforeAll(() => {
    for (const [key, value] of Object.entries(ENV)) {
      saved[key] = process.env[key];
      process.env[key] = value;
    }
  });
  afterAll(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("refuses an anonymous caller without forwarding", () => {
    const { forwarded, res } = handle("/ext/map/tiles/1/2/3.png");
    expect(forwarded).toBe(false);
    expect(res.redirect).toHaveBeenCalledWith(302, "https://host.example");
  });

  it("refuses a caller whose roles are not granted without forwarding", () => {
    const { forwarded, res } = handle("/ext/wiki/books", [RoleType.User]);
    expect(forwarded).toBe(false);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("forwards a caller whose roles are granted", () => {
    expect(handle("/ext/map/tiles/1/2/3.png", [RoleType.User]).forwarded).toBe(true);
    expect(handle("/ext/wiki/books", [RoleType.Admin]).forwarded).toBe(true);
  });

  it("never forwards for an entry that names no role", () => {
    for (const roles of [undefined, [RoleType.User], [RoleType.Super]]) {
      expect(handle("/ext/open/anything", roles).forwarded).toBe(false);
    }
  });
});
