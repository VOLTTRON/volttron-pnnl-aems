import {
  deepFreeze,
  deepMerge,
  parseBoolean,
  templateFormat,
  delay,
  getDifference,
  Removed,
  toOrdinal,
  Chainable,
  chainable,
  typeofNonNullable,
  keyofObject,
  typeofEnum,
  typeofObject,
  typeofString,
  typeofNumber,
  typeofBoolean,
  typeofFunction,
  typeofSymbol,
  typeofArray,
  printEnvironment,
  pick,
  omit,
  xor,
  xorPrimitive,
  debounce,
  chunk,
  difference,
  union,
  sortBy,
  max,
} from "./util";

describe("deepFreeze", () => {
  it("should recursively freeze an object", () => {
    const obj = {
      prop1: "value1",
      prop2: {
        nestedProp1: "nestedValue1",
        nestedProp2: {
          deeplyNestedProp: "deeplyNestedValue",
        },
      },
    };

    const frozenObj = deepFreeze(obj);

    expect(Object.isFrozen(frozenObj)).toBe(true);
    expect(Object.isFrozen(frozenObj.prop2)).toBe(true);
    expect(Object.isFrozen(frozenObj.prop2.nestedProp2)).toBe(true);
  });
});

describe("getDifference", () => {
  it("should return undefined if objects are equal", () => {
    const obj1 = {
      prop1: "value1",
      prop2: {
        nestedProp1: "nestedValue1",
      },
    };
    const obj2 = {
      prop1: "value1",
      prop2: {
        nestedProp1: "nestedValue1",
      },
    };
    const diff = getDifference(obj1, obj2);
    expect(diff).toBe(undefined);
  });

  it("should return the difference between two objects for an updated prop", () => {
    const obj1 = {
      prop1: "value1",
      prop2: {
        nestedProp1: "nestedValue1",
      },
    };
    const obj2 = {
      prop1: "value2",
      prop2: {
        nestedProp1: "nestedValue1",
      },
    };
    const diff = getDifference(obj1, obj2);
    expect(diff).toEqual({ prop1: "value2" });
  });

  it("should return the difference between two objects for an updated nested prop", () => {
    const obj1 = {
      prop1: "value1",
      prop2: {
        nestedProp1: "nestedValue1",
      },
    };
    const obj2 = {
      prop1: "value1",
      prop2: {
        nestedProp1: "nestedValue2",
      },
    };
    const diff = getDifference(obj1, obj2);
    expect(diff).toEqual({ prop2: { nestedProp1: "nestedValue2" } });
  });

  it("should return the difference between two objects for an updated array prop", () => {
    const obj1 = {
      prop1: ["value1"],
    };
    const obj2 = {
      prop1: ["value2"],
    };
    const diff = getDifference(obj1, obj2);
    expect(diff).toEqual({ prop1: ["value2"] });
  });

  it("should return the difference between two objects for a removed object prop", () => {
    const obj1 = {
      prop1: "value1",
      prop2: {
        nestedProp1: "nestedValue1",
      },
    };
    const obj2 = {
      prop1: "value1",
    };
    const diff = getDifference(obj1, obj2);
    expect(diff).toEqual({ prop2: Removed });
  });

  it("should return the difference between two objects for a removed nested prop", () => {
    const obj1 = {
      prop1: "value1",
      prop2: {
        nestedProp1: "nestedValue1",
      },
    };
    const obj2 = {
      prop1: "value1",
      prop2: {},
    };
    const diff = getDifference(obj1, obj2);
    expect(diff).toEqual({ prop2: { nestedProp1: Removed } });
  });

  it("should return the difference between two objects for an added prop", () => {
    const obj1 = {
      prop1: "value1",
    };
    const obj2 = {
      prop1: "value1",
      prop2: "value2",
    };
    const diff = getDifference(obj1, obj2);
    expect(diff).toEqual({ prop2: "value2" });
  });

  it("should return the difference between two objects for an added nested prop", () => {
    const obj1 = {
      prop1: "value1",
    };
    const obj2 = {
      prop1: "value1",
      prop2: {
        nestedProp1: "nestedValue1",
      },
    };
    const diff = getDifference(obj1, obj2);
    expect(diff).toEqual({ prop2: { nestedProp1: "nestedValue1" } });
  });

  it("should return the difference between two objects for an updated array value", () => {
    const obj1 = {
      prop1: ["value1"],
    };
    const obj2 = {
      prop1: ["value2"],
    };
    const diff = getDifference(obj1, obj2);
    expect(diff).toEqual({ prop1: ["value2"] });
  });

  it("should return the difference between two objects for a removed array value", () => {
    const obj1 = {
      prop1: ["value1"],
    };
    const obj2 = {
      prop1: [],
    };
    const diff = getDifference(obj1, obj2);
    expect(diff).toEqual({ prop1: [Removed] });
  });

  it("should return the difference between two objects for an added array value", () => {
    const obj1 = {
      prop1: [],
    };
    const obj2 = {
      prop1: ["value1"],
    };
    const diff = getDifference(obj1, obj2);
    expect(diff).toEqual({ prop1: ["value1"] });
  });

  it("should return the difference between two complex objects with updated, added, and removed objects, props, and arrays", () => {
    const obj1 = {
      prop1: "value1",
      prop2: {
        nestedProp1: "nestedValue1",
        nestedProp2: {
          deeplyNestedProp: "deeplyNestedValue",
        },
        nestedProp3: ["value1", "value2"],
      },
      prop3: ["value1"],
    };
    const obj2 = {
      prop1: "value2",
      prop2: {
        nestedProp1: "nestedValue2",
        nestedProp2: {},
        nestedProp3: [null, "value2", "value3"],
      },
      prop4: "value3",
    };
    const diff = getDifference(obj1, obj2);
    expect(diff).toEqual({
      prop1: "value2",
      prop2: {
        nestedProp1: "nestedValue2",
        nestedProp2: { deeplyNestedProp: Removed },
        nestedProp3: [Removed, undefined, "value3"],
      },
      prop3: Removed,
      prop4: "value3",
    });
  });
});

describe("parseBoolean", () => {
  it("should return true for truthy values", () => {
    expect(parseBoolean("true")).toBe(true);
    expect(parseBoolean("yes")).toBe(true);
    expect(parseBoolean("t")).toBe(true);
    expect(parseBoolean("y")).toBe(true);
    expect(parseBoolean("1")).toBe(true);
  });

  it("should return false for falsy values", () => {
    expect(parseBoolean("false")).toBe(false);
    expect(parseBoolean("no")).toBe(false);
    expect(parseBoolean("f")).toBe(false);
    expect(parseBoolean("n")).toBe(false);
    expect(parseBoolean("0")).toBe(false);
  });

  it("should return false for undefined value", () => {
    expect(parseBoolean()).toBe(false);
  });
});

describe("templateFormat", () => {
  it("should replace placeholders with corresponding properties", () => {
    const template = "Hello, {name}! You are {age} years old.";
    const props = {
      name: "John",
      age: 30,
    };

    const formattedString = templateFormat(template, props);

    expect(formattedString).toBe("Hello, John! You are 30 years old.");
  });

  it("should not replace placeholders if corresponding properties are missing", () => {
    const template = "Hello, {name}! You are {age} years old.";
    const props = {
      name: "John",
      age: 35,
    };

    const formattedString = templateFormat(template, props);

    expect(formattedString).toBe("Hello, John! You are 35 years old.");
  });
});

describe("delay", () => {
  it("should delay execution for the specified duration", async () => {
    const start = Date.now();
    const delayDuration = 500;
    await delay(delayDuration);
    const end = Date.now();
    const elapsed = end - start;

    // give it a little wiggle room
    expect(elapsed).toBeGreaterThanOrEqual(delayDuration - Math.ceil(delayDuration * 0.01));
  });
});

describe("toOrdinal", () => {
  it("should convert numbers to their ordinal representation", () => {
    expect(toOrdinal(1)).toBe("1st");
    expect(toOrdinal(2)).toBe("2nd");
    expect(toOrdinal(3)).toBe("3rd");
    expect(toOrdinal(4)).toBe("4th");
    expect(toOrdinal(5)).toBe("5th");
    expect(toOrdinal(6)).toBe("6th");
    expect(toOrdinal(7)).toBe("7th");
    expect(toOrdinal(8)).toBe("8th");
    expect(toOrdinal(9)).toBe("9th");
    expect(toOrdinal(10)).toBe("10th");
    expect(toOrdinal(11)).toBe("11th");
    expect(toOrdinal(12)).toBe("12th");
    expect(toOrdinal(13)).toBe("13th");
    expect(toOrdinal(14)).toBe("14th");
    expect(toOrdinal(15)).toBe("15th");
    expect(toOrdinal(16)).toBe("16th");
    expect(toOrdinal(17)).toBe("17th");
    expect(toOrdinal(18)).toBe("18th");
    expect(toOrdinal(19)).toBe("19th");
    expect(toOrdinal(20)).toBe("20th");
    expect(toOrdinal(21)).toBe("21st");
    expect(toOrdinal(22)).toBe("22nd");
    expect(toOrdinal(23)).toBe("23rd");
    expect(toOrdinal(24)).toBe("24th");
    expect(toOrdinal(100)).toBe("100th");
    expect(toOrdinal(10101)).toBe("10,101st");
  });
  it("should fail for negative numbers", () => {
    expect(() => toOrdinal(-1)).toThrow(TypeError);
  });
  it("should fail for non-integer numbers", () => {
    expect(() => toOrdinal(1.5)).toThrow(TypeError);
    expect(() => toOrdinal(2.3)).toThrow(TypeError);
  });
  it("should fail for non-numeric values", () => {
    expect(() => toOrdinal("test" as any)).toThrow(TypeError);
    expect(() => toOrdinal(null as any)).toThrow(TypeError);
    expect(() => toOrdinal(undefined as any)).toThrow(TypeError);
  });
});

describe("Chainable<T>", () => {
  it("should allow chaining methods of the same type", () => {
    const chain = new Chainable(5);
    const result = chain
      .next((v) => v + 3)
      .next((v) => v * 2)
      .next((v) => v - 4)
      .end();

    expect(result).toBe(12);
  });

  it("should allow chaining methods of different types", () => {
    const chain = chainable("Hello");
    const result = chain
      .next((v) => v + " World")
      .next((v) => ({ original: v, uppercase: v.toUpperCase() }))
      .end();

    expect(result).toEqual({ original: "Hello World", uppercase: "HELLO WORLD" });
  });
});

describe("typeofNonNullable", () => {
  it("returns true for a non-null, non-undefined value", () => {
    expect(typeofNonNullable("hello")).toBe(true);
    expect(typeofNonNullable(0)).toBe(true);
    expect(typeofNonNullable(false)).toBe(true);
  });
  it("returns false for null", () => {
    expect(typeofNonNullable(null)).toBe(false);
  });
  it("returns false for undefined", () => {
    expect(typeofNonNullable(undefined)).toBe(false);
  });
});

describe("keyofObject", () => {
  it("always returns true", () => {
    expect(keyofObject("anyKey")).toBe(true);
    expect(keyofObject(42)).toBe(true);
    expect(keyofObject(Symbol("s"))).toBe(true);
  });
});

describe("typeofEnum", () => {
  enum Color { Red = "red", Blue = "blue" }
  const isColor = typeofEnum(Color);
  it("returns true for a valid enum value", () => {
    expect(isColor("red")).toBe(true);
    expect(isColor("blue")).toBe(true);
  });
  it("returns false for a non-member value", () => {
    expect(isColor("green")).toBe(false);
    expect(isColor(0)).toBe(false);
  });
});

describe("typeofObject", () => {
  it("returns true for a plain object without callback", () => {
    expect(typeofObject({})).toBe(true);
  });
  it("returns false for a primitive", () => {
    expect(typeofObject("string")).toBe(false);
    expect(typeofObject(42)).toBe(false);
  });
  it("returns true when object passes the callback", () => {
    expect(typeofObject({ x: 1 }, (v) => "x" in v)).toBe(true);
  });
  it("returns false when object fails the callback", () => {
    expect(typeofObject({ x: 1 }, (v) => "y" in v)).toBe(false);
  });
});

describe("typeofString", () => {
  it("returns true for a string", () => {
    expect(typeofString("hello")).toBe(true);
  });
  it("returns false for a non-string", () => {
    expect(typeofString(42)).toBe(false);
    expect(typeofString(null)).toBe(false);
  });
});

describe("typeofNumber", () => {
  it("returns true for a number", () => {
    expect(typeofNumber(42)).toBe(true);
    expect(typeofNumber(0)).toBe(true);
  });
  it("returns false for a non-number", () => {
    expect(typeofNumber("42")).toBe(false);
    expect(typeofNumber(null)).toBe(false);
  });
});

describe("typeofBoolean", () => {
  it("returns true for boolean values", () => {
    expect(typeofBoolean(true)).toBe(true);
    expect(typeofBoolean(false)).toBe(true);
  });
  it("returns false for non-boolean values", () => {
    expect(typeofBoolean("true")).toBe(false);
    expect(typeofBoolean(1)).toBe(false);
  });
});

describe("typeofFunction", () => {
  it("returns true for a function", () => {
    expect(typeofFunction(() => {})).toBe(true);

    expect(typeofFunction(function () {})).toBe(true);
  });
  it("returns false for a non-function", () => {
    expect(typeofFunction("fn")).toBe(false);
    expect(typeofFunction({})).toBe(false);
  });
});

describe("typeofSymbol", () => {
  it("returns true for a symbol", () => {
    expect(typeofSymbol(Symbol("s"))).toBe(true);
  });
  it("returns false for a non-symbol", () => {
    expect(typeofSymbol("symbol")).toBe(false);
    expect(typeofSymbol(42)).toBe(false);
  });
});

describe("typeofArray", () => {
  it("returns true for an array", () => {
    expect(typeofArray([])).toBe(true);
    expect(typeofArray([1, 2, 3])).toBe(true);
  });
  it("returns false for a non-array", () => {
    expect(typeofArray({})).toBe(false);
    expect(typeofArray("array")).toBe(false);
  });
});

describe("deepMerge", () => {
  it("returns target when no sources", () => {
    expect(deepMerge({ a: 1 })).toEqual({ a: 1 });
  });
  it("shallow-merges non-object values from source", () => {
    expect(deepMerge({ a: 1, b: 2 }, { b: 3 })).toEqual({ a: 1, b: 3 });
  });
  it("deeply merges nested objects", () => {
    expect(deepMerge({ a: { x: 1, y: 2 } }, { a: { y: 9 } })).toEqual({ a: { x: 1, y: 9 } });
  });
  it("does not deep-merge arrays — last value wins", () => {
    expect(deepMerge({ a: [1, 2] }, { a: [3] })).toEqual({ a: [3] });
  });
  it("merges multiple sources left-to-right", () => {
    expect(deepMerge({ a: 1 }, { b: 2 }, { c: 3 })).toEqual({ a: 1, b: 2, c: 3 });
  });
  it("later sources override earlier ones", () => {
    expect(deepMerge({ a: 1 }, { a: 2 }, { a: 3 })).toEqual({ a: 3 });
  });
  it("skips undefined values in sources", () => {
    expect(deepMerge({ a: 1, b: 2 }, { b: undefined })).toEqual({ a: 1, b: 2 });
  });
});

describe("pick", () => {
  it("returns only the specified keys", () => {
    expect(pick({ a: 1, b: 2, c: 3 }, ["a", "c"])).toEqual({ a: 1, c: 3 });
  });
  it("ignores keys not present on the object", () => {
    expect(pick({ a: 1 } as any, ["a", "z"])).toEqual({ a: 1 });
  });
  it("returns an empty object when keys is empty", () => {
    expect(pick({ a: 1 }, [])).toEqual({});
  });
});

describe("omit", () => {
  it("removes the specified keys", () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ["b"])).toEqual({ a: 1, c: 3 });
  });
  it("returns the same shape when keys is empty", () => {
    expect(omit({ a: 1, b: 2 }, [])).toEqual({ a: 1, b: 2 });
  });
  it("is a no-op for keys not present on the object", () => {
    expect(omit({ a: 1 } as any, ["z"])).toEqual({ a: 1 });
  });
});

describe("xor", () => {
  it("returns elements present in exactly one array (primitives)", () => {
    expect(xor([1, 2, 3], [2, 3, 4])).toEqual([1, 4]);
  });
  it("returns all elements when arrays have no overlap", () => {
    expect(xor([1, 2], [3, 4])).toEqual([1, 2, 3, 4]);
  });
  it("returns empty when arrays are identical", () => {
    expect(xor([1, 2], [1, 2])).toEqual([]);
  });
  it("handles object elements via JSON.stringify equality", () => {
    expect(xor([{ x: 1 }, { x: 2 }], [{ x: 2 }, { x: 3 }])).toEqual([{ x: 1 }, { x: 3 }]);
  });
  it("handles tuple elements", () => {
    expect(xor([[0, 1], [1, 2]], [[1, 2], [2, 3]])).toEqual([[0, 1], [2, 3]]);
  });
  it("returns empty arrays for two empty inputs", () => {
    expect(xor([], [])).toEqual([]);
  });
});

describe("xorPrimitive", () => {
  it("returns elements present in exactly one array", () => {
    expect(xorPrimitive(["a", "b", "c"], ["b", "c", "d"])).toEqual(["a", "d"]);
  });
  it("handles numbers", () => {
    expect(xorPrimitive([1, 2, 3], [2, 4])).toEqual([1, 3, 4]);
  });
  it("returns empty for identical arrays", () => {
    expect(xorPrimitive([1, 2], [1, 2])).toEqual([]);
  });
});

describe("debounce", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("does not call fn before the delay", () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 100);
    debouncedFn();
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
  });

  it("calls fn after the delay", () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 100);
    debouncedFn();
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("resets the timer on repeated calls", () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 100);
    debouncedFn();
    jest.advanceTimersByTime(50);
    debouncedFn();
    jest.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("passes arguments to fn", () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 10);
    debouncedFn("hello", 42);
    jest.advanceTimersByTime(10);
    expect(fn).toHaveBeenCalledWith("hello", 42);
  });
});

describe("chunk", () => {
  it("splits an array into chunks of the given size", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it("returns a single chunk when size >= array length", () => {
    expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
  });
  it("returns empty for empty array", () => {
    expect(chunk([], 2)).toEqual([]);
  });
  it("returns empty for size < 1", () => {
    expect(chunk([1, 2, 3], 0)).toEqual([]);
  });
});

describe("difference", () => {
  it("returns elements of first array not in others", () => {
    expect(difference([1, 2, 3, 4], [2, 4])).toEqual([1, 3]);
  });
  it("accepts multiple exclusion arrays", () => {
    expect(difference([1, 2, 3, 4, 5], [2], [4])).toEqual([1, 3, 5]);
  });
  it("returns the original array when nothing is excluded", () => {
    expect(difference([1, 2, 3], [])).toEqual([1, 2, 3]);
  });
  it("returns empty when all elements are excluded", () => {
    expect(difference([1, 2], [1, 2])).toEqual([]);
  });
});

describe("union", () => {
  it("merges arrays and deduplicates", () => {
    expect(union([1, 2], [2, 3])).toEqual([1, 2, 3]);
  });
  it("handles multiple arrays", () => {
    expect(union([1], [2], [2, 3])).toEqual([1, 2, 3]);
  });
  it("returns unique values from a single array", () => {
    expect(union([1, 1, 2])).toEqual([1, 2]);
  });
  it("returns empty for no arguments", () => {
    expect(union()).toEqual([]);
  });
});

describe("sortBy", () => {
  it("sorts by a single iteratee", () => {
    const items = [{ n: 3 }, { n: 1 }, { n: 2 }];
    expect(sortBy(items, (v) => v.n)).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
  });
  it("uses multiple iteratees as tiebreakers", () => {
    const items = [
      { a: 1, b: 2 },
      { a: 1, b: 1 },
      { a: 0, b: 9 },
    ];
    expect(sortBy(items, (v) => v.a, (v) => v.b)).toEqual([
      { a: 0, b: 9 },
      { a: 1, b: 1 },
      { a: 1, b: 2 },
    ]);
  });
  it("does not mutate the original array", () => {
    const arr = [3, 1, 2];
    sortBy(arr, (v) => v);
    expect(arr).toEqual([3, 1, 2]);
  });
  it("returns empty array for empty input", () => {
    expect(sortBy([], (v) => v)).toEqual([]);
  });
});

describe("max", () => {
  it("returns the maximum value", () => {
    expect(max([3, 1, 4, 1, 5, 9])).toBe(9);
  });
  it("returns the only element from a single-element array", () => {
    expect(max([7])).toBe(7);
  });
  it("returns undefined for an empty array", () => {
    expect(max([])).toBeUndefined();
  });
  it("handles negative numbers", () => {
    expect(max([-3, -1, -4])).toBe(-1);
  });
});

describe("printEnvironment", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("calls the printable option with the JSON output", () => {
    process.env.APP_NAME = "skeleton";
    const messages: string[] = [];
    printEnvironment({ printable: (m) => messages.push(m) });
    expect(messages).toHaveLength(1);
    const parsed = JSON.parse(messages[0]) as Record<string, string>;
    expect(parsed.APP_NAME).toBe("skeleton");
  });

  it("uses the stringify option when provided", () => {
    const messages: string[] = [];
    printEnvironment({ printable: (m) => messages.push(m), stringify: () => "custom" });
    expect(messages[0]).toBe("custom");
  });

  it("masks PASSWORD keys with asterisks", () => {
    process.env.DB_PASSWORD = "mysecret";
    const messages: string[] = [];
    printEnvironment({ printable: (m) => messages.push(m) });
    const parsed = JSON.parse(messages[0]) as Record<string, string>;
    expect(parsed.DB_PASSWORD).toBe("********");
  });

  it("shows a WARNING when PASSWORD key holds the default placeholder", () => {
    process.env.DB_PASSWORD = "SeT_tHiS_iN_0x3A-.env.secrets-";
    const messages: string[] = [];
    printEnvironment({ printable: (m) => messages.push(m) });
    const parsed = JSON.parse(messages[0]) as Record<string, string>;
    expect(parsed.DB_PASSWORD).toContain("WARNING");
  });

  it("masks embedded password in a URL key", () => {
    process.env.DATABASE_URL = "postgres://user:secretpass@localhost/db";
    const messages: string[] = [];
    printEnvironment({ printable: (m) => messages.push(m) });
    const parsed = JSON.parse(messages[0]) as Record<string, string>;
    expect(parsed.DATABASE_URL).toContain("********");
    expect(parsed.DATABASE_URL).not.toContain("secretpass");
  });

  it("leaves a URL without embedded password unchanged", () => {
    process.env.PUBLIC_URL = "https://example.com/path";
    const messages: string[] = [];
    printEnvironment({ printable: (m) => messages.push(m) });
    const parsed = JSON.parse(messages[0]) as Record<string, string>;
    expect(parsed.PUBLIC_URL).toBe("https://example.com/path");
  });
});
