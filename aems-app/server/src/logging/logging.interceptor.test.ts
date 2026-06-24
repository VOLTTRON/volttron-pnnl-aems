import { Logger } from "@nestjs/common";
import { ExecutionContext, CallHandler } from "@nestjs/common";
import { Request, Response } from "express";
import { of } from "rxjs";
import { HttpLoggingInterceptor } from "./logging.interceptor";

function makeContext(req: Partial<Request>, res: Partial<Response>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req as Request,
      getResponse: () => res as Response,
    }),
  } as unknown as ExecutionContext;
}

function makeHandler(value: unknown = undefined): CallHandler {
  return {
    handle: () => of(value),
  } as CallHandler;
}

describe("HttpLoggingInterceptor", () => {
  let interceptor: HttpLoggingInterceptor;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    interceptor = new HttpLoggingInterceptor();
    logSpy = jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("logs method, url, status, and duration after the response completes", (done) => {
    const ctx = makeContext({ method: "GET", url: "/api/test" }, { statusCode: 200 });
    const handler = makeHandler();

    interceptor.intercept(ctx, handler).subscribe({
      complete: () => {
        expect(logSpy).toHaveBeenCalledTimes(1);
        const message = logSpy.mock.calls[0][0] as string;
        expect(message).toMatch(/Method: GET/);
        expect(message).toMatch(/URL: \/api\/test/);
        expect(message).toMatch(/Status: 200/);
        expect(message).toMatch(/\d+ms/);
        done();
      },
    });
  });

  it("does not log before the response completes", () => {
    const ctx = makeContext({ method: "POST", url: "/api/upload" }, { statusCode: 201 });
    const handler = makeHandler();

    interceptor.intercept(ctx, handler);

    expect(logSpy).not.toHaveBeenCalled();
  });

  it("passes the response value through unchanged", (done) => {
    const payload = { data: "hello" };
    const ctx = makeContext({ method: "GET", url: "/" }, { statusCode: 200 });
    const handler = makeHandler(payload);

    interceptor.intercept(ctx, handler).subscribe({
      next: (value) => {
        expect(value).toBe(payload);
        done();
      },
    });
  });
});
