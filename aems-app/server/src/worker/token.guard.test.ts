import { WorkerTokenGuard } from "./token.guard";
import { AppConfigService } from "@/app.config";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";

function makeConfig(workerToken: string): AppConfigService {
  return {
    service: { backup: { workerToken } },
  } as AppConfigService;
}

function makeContext(header: string | string[] | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: { "x-worker-token": header } }),
    }),
  } as unknown as ExecutionContext;
}

describe("WorkerTokenGuard", () => {
  const TOKEN = "supersecrettoken";

  it("returns true when token matches", () => {
    const guard = new WorkerTokenGuard(makeConfig(TOKEN));
    expect(guard.canActivate(makeContext(TOKEN))).toBe(true);
  });

  it("throws when token does not match", () => {
    const guard = new WorkerTokenGuard(makeConfig(TOKEN));
    expect(() => guard.canActivate(makeContext("wrongtoken"))).toThrow(UnauthorizedException);
  });

  it("throws when header is missing", () => {
    const guard = new WorkerTokenGuard(makeConfig(TOKEN));
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(UnauthorizedException);
  });

  it("throws when configured token is empty", () => {
    const guard = new WorkerTokenGuard(makeConfig(""));
    expect(() => guard.canActivate(makeContext(TOKEN))).toThrow(UnauthorizedException);
  });

  it("uses first element when header is an array", () => {
    const guard = new WorkerTokenGuard(makeConfig(TOKEN));
    expect(guard.canActivate(makeContext([TOKEN, "other"]))).toBe(true);
  });

  it("throws when first array element does not match", () => {
    const guard = new WorkerTokenGuard(makeConfig(TOKEN));
    expect(() => guard.canActivate(makeContext(["wrong", TOKEN]))).toThrow(UnauthorizedException);
  });

  it("throws when token lengths differ (timing-safe path)", () => {
    const guard = new WorkerTokenGuard(makeConfig(TOKEN));
    expect(() => guard.canActivate(makeContext("short"))).toThrow(UnauthorizedException);
  });
});
