import {
  deepFreeze,
  parseBoolean,
  templateFormat,
  delay,
  getDifference,
  Removed,
  toOrdinal,
  Chainable,
  chainable,
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    expect(() => toOrdinal("test" as any)).toThrow(TypeError);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    expect(() => toOrdinal(null as any)).toThrow(TypeError);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
