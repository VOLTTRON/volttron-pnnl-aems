import "reflect-metadata";
import { IsPublicKey, Public } from "./public.decorator";

describe("IsPublicKey", () => {
  it("is a Symbol", () => {
    expect(typeof IsPublicKey).toBe("symbol");
  });
});

describe("Public decorator", () => {
  it("sets isPublic metadata to true on the decorated target", () => {
    class TestController {
      @Public()
      handler() {}
    }

    const metadata = Reflect.getMetadata(IsPublicKey, TestController.prototype.handler);
    expect(metadata).toBe(true);
  });

  it("returns a decorator function", () => {
    const decorator = Public();
    expect(typeof decorator).toBe("function");
  });
});
