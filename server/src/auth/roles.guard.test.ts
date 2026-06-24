import { RolesGuard } from "./roles.guard";
import { Reflector } from "@nestjs/core";
import { ExecutionContext } from "@nestjs/common";
import { RolesKey } from "./roles.decorator";
import Role from "@local/common/src/constants/role";

function makeContext(user: Express.User | undefined, handler = jest.fn(), cls = jest.fn()): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it("returns true when no roles are required", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
    const ctx = makeContext(undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("returns true when user has all required roles", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.User]);
    const ctx = makeContext({ roles: [Role.User] } as Express.User);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("returns true when admin role grants user access (admin grants user)", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.User]);
    const ctx = makeContext({ roles: [Role.Admin] } as Express.User);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("returns false when user is missing a required role", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.Admin]);
    const ctx = makeContext({ roles: [Role.User] } as Express.User);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it("returns false when request.user is undefined", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.User]);
    const ctx = makeContext(undefined);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it("returns false when user has no roles and roles are required", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.Admin]);
    const ctx = makeContext({ roles: [] } as unknown as Express.User);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it("uses RolesKey when calling reflector", () => {
    const spy = jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
    const handler = jest.fn();
    const cls = jest.fn();
    const ctx = makeContext(undefined, handler, cls);
    guard.canActivate(ctx);
    expect(spy).toHaveBeenCalledWith(RolesKey, [handler, cls]);
  });
});
