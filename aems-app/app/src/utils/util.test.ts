import { deepFreeze, parseBoolean, templateFormat, promiseChain, promiseFirst, delay } from "./util";

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

describe("promiseChain", () => {
  it("should execute tasks in series and return an array of results", async () => {
    const tasks = [() => Promise.resolve(1), () => Promise.resolve(2), () => Promise.resolve(3)];

    const results = await promiseChain(tasks);

    expect(results).toEqual([1, 2, 3]);
  });
});

describe("promiseFirst", () => {
  it("should execute tasks in series and return the first resolved promise", async () => {
    const tasks = [
      () => delay(100).then(() => Promise.reject("Error 1")),
      () => delay(200).then(() => Promise.resolve("Result 2")),
      () => delay(300).then(() => Promise.resolve("Result 3")),
    ];

    const result = await promiseFirst(tasks);

    expect(result).toBe("Result 2");
  });

  it("should reject if all promises are rejected", async () => {
    const tasks = [
      () => delay(100).then(() => Promise.reject("Error 1")),
      () => delay(200).then(() => Promise.reject("Error 2")),
      () => delay(300).then(() => Promise.reject("Error 3")),
    ];

    await expect(promiseFirst(tasks)).rejects.toBe("Error 3");
  });
});

describe("delay", () => {
  it("should delay execution for the specified duration", async () => {
    const start = Date.now();
    const delayDuration = 500;
    await delay(delayDuration);
    const end = Date.now();
    const elapsed = end - start;

    expect(elapsed).toBeGreaterThanOrEqual(delayDuration);
  });
});
