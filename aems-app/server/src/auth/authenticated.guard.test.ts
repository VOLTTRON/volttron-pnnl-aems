import "reflect-metadata";
import { ExecutionContext } from "@nestjs/common";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { AuthModule } from "./auth.module";
import { AuthenticatedGuard } from "./authenticated.guard";
import { PublicRoute } from "./public.decorator";
import { RolesGuard } from "./roles.guard";

class Private {
  handler() {}
}

class Mixed {
  @PublicRoute()
  open() {}
  closed() {}
}

@PublicRoute()
class Open {
  handler() {}
}

const context = (cls: new () => object, handler: string, user?: object) =>
  ({
    getHandler: () => (cls.prototype as Record<string, unknown>)[handler],
    getClass: () => cls,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

// scenario: endpoints-private-by-default
describe("HTTP endpoints", () => {
  const guard = new AuthenticatedGuard(new Reflector());

  it("are guarded globally by AuthenticatedGuard then RolesGuard", () => {
    const providers = Reflect.getMetadata("providers", AuthModule) as { provide?: unknown; useClass?: unknown }[];
    const guards = providers.filter((p) => p.provide === APP_GUARD).map((p) => p.useClass);
    expect(guards).toEqual([AuthenticatedGuard, RolesGuard]);
  });

  it("refuse an unauthenticated request by default", () => {
    expect(guard.canActivate(context(Private, "handler"))).toBe(false);
    expect(guard.canActivate(context(Mixed, "closed"))).toBe(false);
  });

  it("admit an unauthenticated request only under @PublicRoute, on the handler or its class", () => {
    expect(guard.canActivate(context(Mixed, "open"))).toBe(true);
    expect(guard.canActivate(context(Open, "handler"))).toBe(true);
  });

  it("admit an authenticated request", () => {
    expect(guard.canActivate(context(Private, "handler", { id: "u1" }))).toBe(true);
  });
});
