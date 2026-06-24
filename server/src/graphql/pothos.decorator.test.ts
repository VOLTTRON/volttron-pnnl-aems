import "reflect-metadata";
import {
  PothosBuilderKey,
  PothosObjectKey,
  PothosInputKey,
  PothosQueryKey,
  PothosMutationKey,
  PothosBuilder,
  PothosObject,
  PothosInput,
  PothosQuery,
  PothosMutation,
} from "./pothos.decorator";

describe("Pothos symbol keys", () => {
  it("are all Symbols", () => {
    for (const key of [
      PothosBuilderKey,
      PothosObjectKey,
      PothosInputKey,
      PothosQueryKey,
      PothosMutationKey,
    ]) {
      expect(typeof key).toBe("symbol");
    }
  });

  it("are all distinct", () => {
    const keys = [
      PothosBuilderKey,
      PothosObjectKey,
      PothosInputKey,
      PothosQueryKey,
      PothosMutationKey,
    ];
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });
});

describe("PothosBuilder decorator", () => {
  it("stores true on the decorated class under PothosBuilderKey", () => {
    @PothosBuilder()
    class TestClass {}
    expect(Reflect.getMetadata(PothosBuilderKey, TestClass)).toBe(true);
  });

  it("returns a decorator function", () => {
    expect(typeof PothosBuilder()).toBe("function");
  });
});

describe("PothosObject decorator", () => {
  it("stores true on the decorated class under PothosObjectKey", () => {
    @PothosObject()
    class TestClass {}
    expect(Reflect.getMetadata(PothosObjectKey, TestClass)).toBe(true);
  });
});

describe("PothosInput decorator", () => {
  it("stores true on the decorated class under PothosInputKey", () => {
    @PothosInput()
    class TestClass {}
    expect(Reflect.getMetadata(PothosInputKey, TestClass)).toBe(true);
  });
});

describe("PothosQuery decorator", () => {
  it("stores true on the decorated class under PothosQueryKey", () => {
    @PothosQuery()
    class TestClass {}
    expect(Reflect.getMetadata(PothosQueryKey, TestClass)).toBe(true);
  });
});

describe("PothosMutation decorator", () => {
  it("stores true on the decorated class under PothosMutationKey", () => {
    @PothosMutation()
    class TestClass {}
    expect(Reflect.getMetadata(PothosMutationKey, TestClass)).toBe(true);
  });
});
