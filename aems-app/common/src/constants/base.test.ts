/* eslint-disable @typescript-eslint/no-unsafe-argument */
import Base from "./base";
import { IConstant } from ".";

interface ITestConstant extends IConstant {
  value: number;
}

class TestConstant extends Base<ITestConstant> {
  constructor() {
    super([
      {
        name: "first",
        label: "First",
        value: 1,
      },
      {
        name: "second",
        label: "Second",
        value: 2,
      },
      {
        name: "third",
        label: "Third",
        value: 3,
      },
    ]);
  }

  First = this.parseStrict("first");
  Second = this.parseStrict("second");
  Third = this.parseStrict("third");
}

describe("constants.Base", () => {
  let testConstant: TestConstant;

  beforeEach(() => {
    testConstant = new TestConstant();
  });

  describe("Base constructor", () => {
    it("should throw error with empty values array", () => {
      expect(() => new (class extends Base<ITestConstant> {
        constructor() {
          super([]);
        }
      })()).toThrow("Values with at least one item must be specified.");
    });
    it("should throw error with null values", () => {
      expect(() => new (class extends Base<ITestConstant> {
        constructor() {
          super(null as any);
        }
      })()).toThrow("Values with at least one item must be specified.");
    });
    it("should throw error with undefined values", () => {
      expect(() => new (class extends Base<ITestConstant> {
        constructor() {
          super(undefined as any);
        }
      })()).toThrow("Values with at least one item must be specified.");
    });
  });

  describe("Base.parse()", () => {
    it("should parse by name", () => {
      expect(testConstant.parse("first")?.name).toEqual("first");
      expect(testConstant.parse("second")?.name).toEqual("second");
      expect(testConstant.parse("third")?.name).toEqual("third");
    });
    it("should parse by label", () => {
      expect(testConstant.parse("First")?.name).toEqual("first");
      expect(testConstant.parse("Second")?.name).toEqual("second");
      expect(testConstant.parse("Third")?.name).toEqual("third");
    });
    it("should parse by index", () => {
      expect(testConstant.parse(0)?.name).toEqual("first");
      expect(testConstant.parse(1)?.name).toEqual("second");
      expect(testConstant.parse(2)?.name).toEqual("third");
    });
    it("should parse object with name property", () => {
      expect(testConstant.parse({ name: "first" } as any)?.name).toEqual("first");
      expect(testConstant.parse({ name: "second" } as any)?.name).toEqual("second");
    });
    it("should return undefined for invalid string", () => {
      expect(testConstant.parse("invalid")).toBeUndefined();
    });
    it("should return undefined for invalid number", () => {
      expect(testConstant.parse(99)).toBeUndefined();
      expect(testConstant.parse(-1)).toBeUndefined();
    });
    it("should return undefined for null", () => {
      expect(testConstant.parse(null as any)).toBeUndefined();
    });
    it("should return undefined for undefined", () => {
      expect(testConstant.parse(undefined as any)).toBeUndefined();
    });
  });

  describe("Base.parseStrict()", () => {
    it("should parse by name", () => {
      expect(testConstant.parseStrict("first")?.name).toEqual("first");
      expect(testConstant.parseStrict("second")?.name).toEqual("second");
      expect(testConstant.parseStrict("third")?.name).toEqual("third");
    });
    it("should parse by label", () => {
      expect(testConstant.parseStrict("First")?.name).toEqual("first");
      expect(testConstant.parseStrict("Second")?.name).toEqual("second");
      expect(testConstant.parseStrict("Third")?.name).toEqual("third");
    });
    it("should parse by index", () => {
      expect(testConstant.parseStrict(0)?.name).toEqual("first");
      expect(testConstant.parseStrict(1)?.name).toEqual("second");
      expect(testConstant.parseStrict(2)?.name).toEqual("third");
    });
    it("should throw error for invalid string", () => {
      expect(() => testConstant.parseStrict("invalid")).toThrow(Error);
    });
    it("should throw error for invalid number", () => {
      expect(() => testConstant.parseStrict(99)).toThrow(Error);
      expect(() => testConstant.parseStrict(-1)).toThrow(Error);
    });
    it("should throw error for null", () => {
      expect(() => testConstant.parseStrict(null as any)).toThrow(Error);
    });
    it("should throw error for undefined", () => {
      expect(() => testConstant.parseStrict(undefined as any)).toThrow(Error);
    });
  });

  describe("Base.matcher", () => {
    it("should have default matcher", () => {
      expect(testConstant.matcher).toBeDefined();
      expect(typeof testConstant.matcher).toBe("function");
    });
    it("should allow setting custom matcher", () => {
      const originalMatcher = testConstant.matcher;
      testConstant.matcher = (v) => v.toLowerCase();
      expect(testConstant.parse("FIRST")?.name).toEqual("first");
      testConstant.matcher = originalMatcher;
    });
    it("should use matcher for string matching", () => {
      testConstant.matcher = (v) => v.replace(/\d+/g, "");
      expect(testConstant.parse("first123")?.name).toEqual("first");
      testConstant.matcher = (v) => v; // reset
    });
  });

  describe("Base.values", () => {
    it("should return all values", () => {
      expect(testConstant.values).toHaveLength(3);
      expect(testConstant.values[0].name).toEqual("first");
      expect(testConstant.values[1].name).toEqual("second");
      expect(testConstant.values[2].name).toEqual("third");
    });
    it("should return immutable values", () => {
      expect(testConstant.values[0]).toBeDefined();
      expect(testConstant.values[1]).toBeDefined();
      expect(testConstant.values[2]).toBeDefined();
    });
  });

  describe("Base.constants", () => {
    it("should return constants map", () => {
      expect(testConstant.constants).toBeDefined();
      expect(testConstant.constants["first"]).toBeDefined();
      expect(testConstant.constants["First"]).toBeDefined();
      expect(testConstant.constants["second"]).toBeDefined();
      expect(testConstant.constants["Second"]).toBeDefined();
    });
    it("should map names and labels to same objects", () => {
      expect(testConstant.constants["first"]).toStrictEqual(testConstant.constants["First"]);
      expect(testConstant.constants["second"]).toStrictEqual(testConstant.constants["Second"]);
    });
  });

  describe("Base.length", () => {
    it("should return correct length", () => {
      expect(testConstant.length).toEqual(3);
    });
  });

  describe("Base iteration", () => {
    it("should be iterable", () => {
      const values = [...testConstant];
      expect(values).toHaveLength(3);
      expect(values[0].name).toEqual("first");
      expect(values[1].name).toEqual("second");
      expect(values[2].name).toEqual("third");
    });
    it("should support for...of loop", () => {
      const names: string[] = [];
      for (const value of testConstant) {
        names.push(value.name);
      }
      expect(names).toEqual(["first", "second", "third"]);
    });
  });

  describe("Base with decorator", () => {
    it("should apply decorator function", () => {
      class DecoratedConstant extends Base<ITestConstant> {
        constructor() {
          super(
            [
              { name: "test", label: "Test", value: 1 },
            ],
            (constant, value) => ({ ...value, decoratedValue: value.value * 2 })
          );
        }
      }
      const decorated = new DecoratedConstant();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect((decorated.values[0] as any).decoratedValue as number).toEqual(2);
    });
  });

  describe("Base edge cases", () => {
    it("should handle complex object parsing", () => {
      const complexObject = {
        name: "first",
        otherProperty: "ignored"
      };
      expect(testConstant.parse(complexObject as any)?.name).toEqual("first");
    });
    it("should handle string keys filtering", () => {
      // The _keys property should only include string properties
      expect(testConstant.values[0]).toHaveProperty("name");
      expect(testConstant.values[0]).toHaveProperty("label");
      expect(testConstant.values[0]).toHaveProperty("value");
    });
    it("should handle matcher with fallback", () => {
      testConstant.matcher = (v) => {
        if (v === "alias") return "first";
        return v;
      };
      expect(testConstant.parse("alias")?.name).toEqual("first");
      testConstant.matcher = (v) => v; // reset
    });
  });

  describe("Base error messages", () => {
    it("should provide detailed error message in parseStrict", () => {
      try {
        testConstant.parseStrict("nonexistent");
        fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).message).toContain("Unknown constant");
        expect((error as Error).message).toContain("nonexistent");
      }
    });
    it("should handle complex object in error message", () => {
      try {
        testConstant.parseStrict({ complex: "object" } as any);
        fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).message).toContain("Unknown constant");
      }
    });
  });
});
