jest.mock("http", () => ({
  request: jest.fn(),
}));

jest.mock("https", () => ({
  request: jest.fn(),
}));

import * as http from "http";
import * as https from "https";
import { ExtRewriteMiddleware } from "./ext.middleware";
import { AppConfigService } from "@/app.config";
import { Request, Response, NextFunction } from "express";

const mockHttpRequest = http.request as jest.MockedFunction<typeof http.request>;
const mockHttpsRequest = https.request as jest.MockedFunction<typeof https.request>;

function makeGranted(result: boolean) {
  return { granted: jest.fn().mockReturnValue(result) };
}

function makeConfig(ext: Record<string, any> = {}): AppConfigService {
  return { ext } as unknown as AppConfigService;
}

function makeReq(overrides: Record<string, unknown> = {}): Request {
  return {
    url: "/ext/map/tiles",
    originalUrl: "/ext/map/tiles",
    method: "GET",
    headers: { host: "example.com" },
    user: undefined,
    pipe: jest.fn().mockReturnThis(),
    ...overrides,
  } as unknown as Request;
}

function makeRes(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    writeHead: jest.fn(),
    pipe: jest.fn(),
  } as unknown as Response;
}

function makeNext(): NextFunction {
  return jest.fn() as NextFunction;
}

function makeProxyReq(overrides: Record<string, unknown> = {}): http.ClientRequest {
  return {
    on: jest.fn().mockReturnThis(),
    pipe: jest.fn().mockReturnThis(),
    ...overrides,
  } as unknown as http.ClientRequest;
}

describe("ExtRewriteMiddleware", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls next() when no matching config for the URL", () => {
    const middleware = new ExtRewriteMiddleware(makeConfig({}));
    const req = makeReq({ url: "/api/other" });
    const next = makeNext();

    middleware.use(req, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it("calls next() when config path does not match the request URL", () => {
    const ext = { map: { path: "/ext/map", authorized: "http://tiles.local", role: makeGranted(true) } };
    const middleware = new ExtRewriteMiddleware(makeConfig(ext));
    const req = makeReq({ url: "/ext/other" });
    const next = makeNext();

    middleware.use(req, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it("proxies request via http when authorized URL is http://", () => {
    const proxyReq = makeProxyReq();
    mockHttpRequest.mockReturnValue(proxyReq);

    const ext = { map: { path: "/ext/map", authorized: "http://tiles.local" } };
    const middleware = new ExtRewriteMiddleware(makeConfig(ext));
    const req = makeReq({ url: "/ext/map/layer.json", originalUrl: "/ext/map/layer.json" });

    middleware.use(req, makeRes(), makeNext());

    expect(mockHttpRequest).toHaveBeenCalled();
    expect(mockHttpsRequest).not.toHaveBeenCalled();
  });

  it("proxies request via https when authorized URL is https://", () => {
    const proxyReq = makeProxyReq();
    mockHttpsRequest.mockReturnValue(proxyReq);

    const ext = { secure: { path: "/ext/secure", authorized: "https://secure.local" } };
    const middleware = new ExtRewriteMiddleware(makeConfig(ext));
    const req = makeReq({ url: "/ext/secure/data", originalUrl: "/ext/secure/data" });

    middleware.use(req, makeRes(), makeNext());

    expect(mockHttpsRequest).toHaveBeenCalled();
    expect(mockHttpRequest).not.toHaveBeenCalled();
  });

  it("returns 403 when user does not have the required role and no unauthorized redirect", () => {
    const ext = {
      restricted: {
        path: "/ext/restricted",
        authorized: "http://internal.local",
        role: makeGranted(false),
      },
    };
    const middleware = new ExtRewriteMiddleware(makeConfig(ext));
    const req = makeReq({ url: "/ext/restricted/data", originalUrl: "/ext/restricted/data", user: { roles: [] } });
    const res = makeRes();

    middleware.use(req, res, makeNext());

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("redirects to unauthorized URL when user lacks role and unauthorized is configured", () => {
    const ext = {
      restricted: {
        path: "/ext/restricted",
        authorized: "http://internal.local",
        role: makeGranted(false),
        unauthorized: "/forbidden",
      },
    };
    const middleware = new ExtRewriteMiddleware(makeConfig(ext));
    const req = makeReq({ url: "/ext/restricted/data", originalUrl: "/ext/restricted/data", user: { roles: [] } });
    const res = makeRes();

    middleware.use(req, res, makeNext());

    expect(res.redirect).toHaveBeenCalledWith(expect.any(Number), "/forbidden");
  });

  it("allows request when user has the required role", () => {
    const proxyReq = makeProxyReq();
    mockHttpRequest.mockReturnValue(proxyReq);

    const ext = {
      allowed: {
        path: "/ext/allowed",
        authorized: "http://internal.local",
        role: makeGranted(true),
      },
    };
    const middleware = new ExtRewriteMiddleware(makeConfig(ext));
    const req = makeReq({
      url: "/ext/allowed/resource",
      originalUrl: "/ext/allowed/resource",
      user: { roles: ["user"] },
    });

    middleware.use(req, makeRes(), makeNext());

    expect(mockHttpRequest).toHaveBeenCalled();
  });

  it("pipes the proxy response back to the client response", () => {
    let proxyResCallback: ((proxyRes: any) => void) | undefined;
    const proxyReq = makeProxyReq();
    mockHttpRequest.mockImplementation((_url: any, _opts: any, cb: any) => {
      proxyResCallback = cb as (proxyRes: any) => void;
      return proxyReq;
    });

    const ext = { map: { path: "/ext/map", authorized: "http://tiles.local" } };
    const middleware = new ExtRewriteMiddleware(makeConfig(ext));
    const req = makeReq({ url: "/ext/map/tile", originalUrl: "/ext/map/tile" });
    const res = makeRes();

    middleware.use(req, res, makeNext());

    const proxyRes = { statusCode: 200, headers: {}, pipe: jest.fn() };
    proxyResCallback?.(proxyRes);

    expect(res.writeHead).toHaveBeenCalledWith(200, {});
    expect(proxyRes.pipe).toHaveBeenCalledWith(res);
  });

  it("skips configs that are missing path or authorized", () => {
    const ext = {
      incomplete: { path: "/ext/incomplete" },
      noPath: { authorized: "http://somewhere.local" },
    };
    const middleware = new ExtRewriteMiddleware(makeConfig(ext));
    const req = makeReq({ url: "/ext/incomplete/data", originalUrl: "/ext/incomplete/data" });
    const next = makeNext();

    middleware.use(req, makeRes(), next);

    expect(next).toHaveBeenCalled();
    expect(mockHttpRequest).not.toHaveBeenCalled();
  });
});
