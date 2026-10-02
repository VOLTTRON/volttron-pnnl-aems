import "reflect-metadata";
import { IsPublicKey, PublicRoute } from "./public.decorator";

describe("IsPublicKey", () => {
  it("is a Symbol", () => {
    expect(typeof IsPublicKey).toBe("symbol");
  });
});

describe("PublicRoute decorator", () => {
  it("sets isPublic metadata to true on the decorated target", () => {
    class TestController {
      @PublicRoute()
      handler() {}
    }

    const metadata = Reflect.getMetadata(IsPublicKey, TestController.prototype.handler);
    expect(metadata).toBe(true);
  });

  it("returns a decorator function", () => {
    const decorator = PublicRoute();
    expect(typeof decorator).toBe("function");
  });
});
