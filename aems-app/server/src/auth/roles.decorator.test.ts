import "reflect-metadata";
import { RolesKey, Roles } from "./roles.decorator";

describe("RolesKey", () => {
  it("is a Symbol", () => {
    expect(typeof RolesKey).toBe("symbol");
  });
});

describe("Roles decorator", () => {
  it("sets the roles metadata array on the decorated target", () => {
    class TestController {
      @Roles("admin" as any, "user" as any)
      handler() {}
    }

    const metadata = Reflect.getMetadata(RolesKey, TestController.prototype.handler);
    expect(metadata).toEqual(["admin", "user"]);
  });

  it("sets an empty array when no roles are provided", () => {
    class TestController {
      @Roles()
      handler() {}
    }

    const metadata = Reflect.getMetadata(RolesKey, TestController.prototype.handler);
    expect(metadata).toEqual([]);
  });

  it("returns a decorator function", () => {
    const decorator = Roles("admin" as any);
    expect(typeof decorator).toBe("function");
  });
});
