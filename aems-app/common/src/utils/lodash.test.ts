import {
  pick,
  omit,
  compact,
  flatten,
  flattenDeep,
  uniq,
  uniqBy,
  intersection,
  intersectionBy,
  difference,
  differenceBy,
  union,
  xor,
  groupBy,
  keyBy,
  countBy,
  zipObject,
  first,
  last,
  range,
  sortBy,
  orderBy,
  chunk,
  max,
  maxBy,
  min,
  minBy,
  sum,
  sumBy,
  mean,
  meanBy,
  get,
  set,
  has,
  mapKeys,
  mapValues,
  invert,
  defaults,
  pickBy,
  omitBy,
  camelCase,
  snakeCase,
  kebabCase,
  capitalize,
  startCase,
  truncate,
  repeat,
  pad,
  isNil,
  isObject,
  isPlainObject,
  isEmpty,
  isEqual,
  debounce,
  throttle,
  once,
  memoize,
  noop,
  identity,
  clamp,
  isArray,
  isNumber,
  isString,
  upperFirst,
  cloneDeep,
  merge,
  uniqWith,
} from "./lodash";

// ---------------------------------------------------------------------------
// Array
// ---------------------------------------------------------------------------

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

describe("compact", () => {
  it("removes falsy values", () => {
    expect(compact([0, 1, false, 2, "", 3, null, undefined, NaN])).toEqual([1, 2, 3]);
  });
  it("returns empty for all-falsy input", () => {
    expect(compact([null, undefined, false, 0, ""])).toEqual([]);
  });
  it("returns a copy when all values are truthy", () => {
    expect(compact([1, 2, 3])).toEqual([1, 2, 3]);
  });
});

describe("flatten", () => {
  it("flattens one level", () => {
    expect(flatten([[1, 2], [3, 4]])).toEqual([1, 2, 3, 4]);
  });
  it("does not flatten more than one level", () => {
    expect(flatten([[1, [2, 3]], [4]])).toEqual([1, [2, 3], 4]);
  });
  it("returns a copy of a flat array", () => {
    expect(flatten([1, 2, 3])).toEqual([1, 2, 3]);
  });
});

describe("flattenDeep", () => {
  it("flattens recursively", () => {
    expect(flattenDeep([1, [2, [3, [4]]]])).toEqual([1, 2, 3, 4]);
  });
  it("handles already-flat arrays", () => {
    expect(flattenDeep([1, 2, 3])).toEqual([1, 2, 3]);
  });
});

describe("uniq", () => {
  it("removes duplicate primitives", () => {
    expect(uniq([1, 2, 1, 3, 2])).toEqual([1, 2, 3]);
  });
  it("preserves first occurrence order", () => {
    expect(uniq(["b", "a", "b", "c"])).toEqual(["b", "a", "c"]);
  });
  it("returns empty for empty input", () => {
    expect(uniq([])).toEqual([]);
  });
});

describe("uniqBy", () => {
  it("deduplicates by iteratee", () => {
    const input = [{ id: 1, v: "a" }, { id: 2, v: "b" }, { id: 1, v: "c" }];
    expect(uniqBy(input, (x) => x.id)).toEqual([{ id: 1, v: "a" }, { id: 2, v: "b" }]);
  });
  it("keeps first occurrence", () => {
    expect(uniqBy([1.1, 1.2, 2.3], Math.floor)).toEqual([1.1, 2.3]);
  });
});

describe("intersection", () => {
  it("returns elements present in all arrays", () => {
    expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
  });
  it("handles three arrays", () => {
    expect(intersection([1, 2, 3], [2, 3], [3, 4])).toEqual([3]);
  });
  it("returns empty when there is no overlap", () => {
    expect(intersection([1, 2], [3, 4])).toEqual([]);
  });
  it("returns empty for no arguments", () => {
    expect(intersection()).toEqual([]);
  });
});

describe("intersectionBy", () => {
  it("intersects by iteratee", () => {
    expect(intersectionBy([2.1, 1.2], [2.3, 3.4], Math.floor)).toEqual([2.1]);
  });
  it("works with object arrays", () => {
    const a = [{ x: 1 }, { x: 2 }];
    const b = [{ x: 2 }, { x: 3 }];
    expect(intersectionBy(a, b, (v) => v.x)).toEqual([{ x: 2 }]);
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

describe("differenceBy", () => {
  it("excludes by iteratee", () => {
    expect(differenceBy([2.1, 1.2], [2.3, 3.4], Math.floor)).toEqual([1.2]);
  });
  it("works with object arrays", () => {
    const a = [{ x: 1 }, { x: 2 }, { x: 3 }];
    const b = [{ x: 2 }];
    expect(differenceBy(a, b, (v) => v.x)).toEqual([{ x: 1 }, { x: 3 }]);
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

describe("groupBy", () => {
  it("groups by iteratee result", () => {
    expect(groupBy([1, 2, 3, 4], (n) => String(n % 2 === 0 ? "even" : "odd"))).toEqual({
      odd: [1, 3],
      even: [2, 4],
    });
  });
  it("groups objects by a property", () => {
    const input = [{ t: "a" }, { t: "b" }, { t: "a" }];
    expect(groupBy(input, (v) => v.t)).toEqual({ a: [{ t: "a" }, { t: "a" }], b: [{ t: "b" }] });
  });
});

describe("keyBy", () => {
  it("keys array by iteratee", () => {
    const input = [{ id: "a", v: 1 }, { id: "b", v: 2 }];
    expect(keyBy(input, (v) => v.id)).toEqual({ a: { id: "a", v: 1 }, b: { id: "b", v: 2 } });
  });
  it("last value wins for duplicate keys", () => {
    const input = [{ id: "a", v: 1 }, { id: "a", v: 2 }];
    expect(keyBy(input, (v) => v.id)).toEqual({ a: { id: "a", v: 2 } });
  });
});

describe("countBy", () => {
  it("counts by iteratee", () => {
    expect(countBy(["one", "two", "three"], (s) => String(s.length))).toEqual({ "3": 2, "5": 1 });
  });
  it("returns empty object for empty array", () => {
    expect(countBy([], (s) => s)).toEqual({});
  });
});

describe("zipObject", () => {
  it("zips keys and values into an object", () => {
    expect(zipObject(["a", "b", "c"], [1, 2, 3])).toEqual({ a: 1, b: 2, c: 3 });
  });
  it("extra keys get undefined values", () => {
    expect(zipObject(["a", "b"], [1])).toEqual({ a: 1, b: undefined });
  });
});

describe("first", () => {
  it("returns the first element", () => {
    expect(first([1, 2, 3])).toBe(1);
  });
  it("returns undefined for empty array", () => {
    expect(first([])).toBeUndefined();
  });
});

describe("last", () => {
  it("returns the last element", () => {
    expect(last([1, 2, 3])).toBe(3);
  });
  it("returns undefined for empty array", () => {
    expect(last([])).toBeUndefined();
  });
});

describe("range (sequence generator)", () => {
  it("one argument: [0, end)", () => {
    expect(range(5)).toEqual([0, 1, 2, 3, 4]);
  });
  it("two arguments: [start, end)", () => {
    expect(range(2, 5)).toEqual([2, 3, 4]);
  });
  it("three arguments: [start, end, step)", () => {
    expect(range(0, 10, 2)).toEqual([0, 2, 4, 6, 8]);
  });
  it("returns empty for range(0)", () => {
    expect(range(0)).toEqual([]);
  });
  it("returns empty when start >= end", () => {
    expect(range(5, 2)).toEqual([]);
  });
  it("throws for step === 0", () => {
    expect(() => range(0, 5, 0)).toThrow(RangeError);
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

describe("orderBy", () => {
  it("sorts ascending", () => {
    const items = [{ n: 3 }, { n: 1 }, { n: 2 }];
    expect(orderBy(items, [(v) => v.n], ["asc"])).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
  });
  it("sorts descending", () => {
    const items = [{ n: 1 }, { n: 3 }, { n: 2 }];
    expect(orderBy(items, [(v) => v.n], ["desc"])).toEqual([{ n: 3 }, { n: 2 }, { n: 1 }]);
  });
  it("uses tiebreaker with mixed directions", () => {
    const items = [{ a: 1, b: 2 }, { a: 1, b: 1 }, { a: 2, b: 3 }];
    expect(orderBy(items, [(v) => v.a, (v) => v.b], ["asc", "desc"])).toEqual([
      { a: 1, b: 2 },
      { a: 1, b: 1 },
      { a: 2, b: 3 },
    ]);
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

describe("maxBy", () => {
  it("returns element with max iteratee value", () => {
    expect(maxBy([{ n: 1 }, { n: 3 }, { n: 2 }], (v) => v.n)).toEqual({ n: 3 });
  });
  it("returns undefined for empty array", () => {
    expect(maxBy([], (v) => v)).toBeUndefined();
  });
});

describe("min", () => {
  it("returns the minimum value", () => {
    expect(min([3, 1, 4, 1, 5])).toBe(1);
  });
  it("returns undefined for empty array", () => {
    expect(min([])).toBeUndefined();
  });
  it("handles negative numbers", () => {
    expect(min([-3, -1, -4])).toBe(-4);
  });
});

describe("minBy", () => {
  it("returns element with min iteratee value", () => {
    expect(minBy([{ n: 3 }, { n: 1 }, { n: 2 }], (v) => v.n)).toEqual({ n: 1 });
  });
  it("returns undefined for empty array", () => {
    expect(minBy([], (v) => v)).toBeUndefined();
  });
});

describe("sum", () => {
  it("sums an array of numbers", () => {
    expect(sum([1, 2, 3, 4])).toBe(10);
  });
  it("returns 0 for empty array", () => {
    expect(sum([])).toBe(0);
  });
});

describe("sumBy", () => {
  it("sums by iteratee", () => {
    expect(sumBy([{ n: 1 }, { n: 2 }, { n: 3 }], (v) => v.n)).toBe(6);
  });
  it("returns 0 for empty array", () => {
    expect(sumBy([], (v) => v)).toBe(0);
  });
});

describe("mean", () => {
  it("returns the arithmetic mean", () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });
  it("returns undefined for empty array", () => {
    expect(mean([])).toBeUndefined();
  });
});

describe("meanBy", () => {
  it("returns the mean of iteratee values", () => {
    expect(meanBy([{ n: 2 }, { n: 4 }], (v) => v.n)).toBe(3);
  });
  it("returns undefined for empty array", () => {
    expect(meanBy([], (v) => v)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Object
// ---------------------------------------------------------------------------

describe("get", () => {
  const obj = { a: { b: { c: 42 } }, arr: [10, 20] };

  it("reads a nested path with dot notation", () => {
    expect(get(obj, "a.b.c")).toBe(42);
  });
  it("reads a nested path with bracket notation", () => {
    expect(get(obj, "arr[1]")).toBe(20);
  });
  it("returns defaultValue for missing path", () => {
    expect(get(obj, "a.x.y", 99)).toBe(99);
  });
  it("returns defaultValue when root is null", () => {
    expect(get(null, "a.b", "def")).toBe("def");
  });
  it("accepts a string-array path", () => {
    expect(get(obj, ["a", "b", "c"])).toBe(42);
  });
});

describe("set", () => {
  it("sets a nested value and returns the object", () => {
    const obj: any = { a: { b: 1 } };
    const result = set(obj, "a.b", 99);
    expect(result).toBe(obj);
    expect(obj.a.b).toBe(99);
  });
  it("creates intermediate objects for missing path segments", () => {
    const obj: any = {};
    set(obj, "a.b.c", 7);
    expect(obj.a.b.c).toBe(7);
  });
  it("supports bracket notation", () => {
    const obj: any = { arr: [0, 0, 0] };
    set(obj, "arr[1]", 99);
    expect(obj.arr[1]).toBe(99);
  });
});

describe("has", () => {
  it("returns true for an existing path", () => {
    expect(has({ a: { b: 1 } }, "a.b")).toBe(true);
  });
  it("returns false for a missing path", () => {
    expect(has({ a: 1 }, "a.b")).toBe(false);
  });
  it("returns false for null root", () => {
    expect(has(null, "a")).toBe(false);
  });
  it("accepts a string-array path", () => {
    expect(has({ x: { y: 0 } }, ["x", "y"])).toBe(true);
  });
});

describe("mapKeys", () => {
  it("transforms keys by iteratee", () => {
    expect(mapKeys({ a: 1, b: 2 }, (_v, k) => k.toUpperCase())).toEqual({ A: 1, B: 2 });
  });
  it("passes value to iteratee", () => {
    expect(mapKeys({ x: 1, y: 2 }, (v, _k) => String(v))).toEqual({ "1": 1, "2": 2 });
  });
});

describe("mapValues", () => {
  it("transforms values by iteratee", () => {
    expect(mapValues({ a: 1, b: 2 }, (v) => v * 2)).toEqual({ a: 2, b: 4 });
  });
  it("passes key to iteratee", () => {
    expect(mapValues({ x: 1 }, (v, k) => `${k}:${v}`)).toEqual({ x: "x:1" });
  });
});

describe("invert", () => {
  it("swaps keys and values", () => {
    expect(invert({ a: "1", b: "2" })).toEqual({ "1": "a", "2": "b" });
  });
  it("last key wins for duplicate values", () => {
    expect(invert({ a: "1", b: "1" })).toEqual({ "1": "b" });
  });
});

describe("defaults", () => {
  it("fills in undefined properties from sources", () => {
    expect(defaults({ a: 1 } as any, { a: 2, b: 3 })).toEqual({ a: 1, b: 3 });
  });
  it("does not overwrite falsy but defined values", () => {
    const obj: any = { a: 0, b: "" };
    defaults(obj, { a: 99, b: "fallback", c: true });
    expect(obj).toEqual({ a: 0, b: "", c: true });
  });
  it("mutates and returns the same object", () => {
    const obj: any = { a: 1 };
    expect(defaults(obj, { b: 2 })).toBe(obj);
  });
});

describe("pickBy", () => {
  it("keeps properties where predicate is true", () => {
    expect(pickBy({ a: 1, b: 0, c: 2 }, (v) => (v as number) > 0)).toEqual({ a: 1, c: 2 });
  });
  it("defaults to Boolean predicate", () => {
    expect(pickBy({ a: 1, b: 0, c: null as any, d: "hi" })).toEqual({ a: 1, d: "hi" });
  });
});

describe("omitBy", () => {
  it("removes properties where predicate is true", () => {
    expect(omitBy({ a: 1, b: 0, c: 2 }, (v) => v === 0)).toEqual({ a: 1, c: 2 });
  });
  it("keeps all when predicate always returns false", () => {
    expect(omitBy({ a: 1, b: 2 }, () => false)).toEqual({ a: 1, b: 2 });
  });
});

// ---------------------------------------------------------------------------
// String
// ---------------------------------------------------------------------------

describe("camelCase", () => {
  it("converts snake_case", () => {
    expect(camelCase("foo_bar_baz")).toBe("fooBarBaz");
  });
  it("converts kebab-case", () => {
    expect(camelCase("foo-bar")).toBe("fooBar");
  });
  it("converts space-separated words", () => {
    expect(camelCase("foo bar")).toBe("fooBar");
  });
  it("lowercases the first letter of PascalCase", () => {
    expect(camelCase("FooBar")).toBe("fooBar");
  });
});

describe("snakeCase", () => {
  it("converts camelCase", () => {
    expect(snakeCase("fooBarBaz")).toBe("foo_bar_baz");
  });
  it("converts space-separated words", () => {
    expect(snakeCase("foo bar baz")).toBe("foo_bar_baz");
  });
  it("converts kebab-case", () => {
    expect(snakeCase("foo-bar")).toBe("foo_bar");
  });
});

describe("kebabCase", () => {
  it("converts camelCase", () => {
    expect(kebabCase("fooBarBaz")).toBe("foo-bar-baz");
  });
  it("converts space-separated words", () => {
    expect(kebabCase("foo bar baz")).toBe("foo-bar-baz");
  });
  it("converts snake_case", () => {
    expect(kebabCase("foo_bar")).toBe("foo-bar");
  });
});

describe("capitalize", () => {
  it("uppercases first char and lowercases rest", () => {
    expect(capitalize("fOO")).toBe("Foo");
  });
  it("handles empty string", () => {
    expect(capitalize("")).toBe("");
  });
});

describe("startCase", () => {
  it("capitalizes each word from space-separated string", () => {
    expect(startCase("foo bar")).toBe("Foo Bar");
  });
  it("splits camelCase words", () => {
    expect(startCase("fooBar")).toBe("Foo Bar");
  });
});

describe("truncate", () => {
  it("truncates to 30 chars by default", () => {
    const str = "a".repeat(40);
    const result = truncate(str);
    expect(result).toHaveLength(30);
    expect(result.endsWith("...")).toBe(true);
  });
  it("does not truncate short strings", () => {
    expect(truncate("hello", { length: 10 })).toBe("hello");
  });
  it("uses custom omission", () => {
    expect(truncate("hello world", { length: 8, omission: "…" })).toBe("hello w…");
  });
});

describe("repeat", () => {
  it("repeats a string n times", () => {
    expect(repeat("ab", 3)).toBe("ababab");
  });
  it("returns empty for n=0", () => {
    expect(repeat("ab", 0)).toBe("");
  });
  it("floors fractional n", () => {
    expect(repeat("x", 2.9)).toBe("xx");
  });
});

describe("pad", () => {
  it("pads both sides evenly", () => {
    expect(pad("hi", 6)).toBe("  hi  ");
  });
  it("adds extra padding to right when total is odd", () => {
    expect(pad("hi", 5)).toBe(" hi  ");
  });
  it("returns string unchanged when already at length", () => {
    expect(pad("hi", 2)).toBe("hi");
  });
  it("uses custom pad character", () => {
    expect(pad("hi", 6, "-")).toBe("--hi--");
  });
});

// ---------------------------------------------------------------------------
// Lang / type predicates
// ---------------------------------------------------------------------------

describe("isNil", () => {
  it("returns true for null", () => {
    expect(isNil(null)).toBe(true);
  });
  it("returns true for undefined", () => {
    expect(isNil(undefined)).toBe(true);
  });
  it("returns false for 0", () => {
    expect(isNil(0)).toBe(false);
  });
  it("returns false for empty string", () => {
    expect(isNil("")).toBe(false);
  });
});

describe("isObject", () => {
  it("returns true for plain objects", () => {
    expect(isObject({})).toBe(true);
  });
  it("returns true for arrays", () => {
    expect(isObject([])).toBe(true);
  });
  it("returns false for null", () => {
    expect(isObject(null)).toBe(false);
  });
  it("returns false for number primitives", () => {
    expect(isObject(42)).toBe(false);
  });
  it("returns false for string primitives", () => {
    expect(isObject("str")).toBe(false);
  });
});

describe("isPlainObject", () => {
  it("returns true for object literals", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });
  it("returns false for arrays", () => {
    expect(isPlainObject([])).toBe(false);
  });
  it("returns false for class instances", () => {
    expect(isPlainObject(new Date())).toBe(false);
  });
  it("returns false for null", () => {
    expect(isPlainObject(null)).toBe(false);
  });
});

describe("isEmpty", () => {
  it("returns true for null", () => {
    expect(isEmpty(null)).toBe(true);
  });
  it("returns true for undefined", () => {
    expect(isEmpty(undefined)).toBe(true);
  });
  it("returns true for empty string", () => {
    expect(isEmpty("")).toBe(true);
  });
  it("returns true for empty array", () => {
    expect(isEmpty([])).toBe(true);
  });
  it("returns true for empty object", () => {
    expect(isEmpty({})).toBe(true);
  });
  it("returns false for non-empty string", () => {
    expect(isEmpty("x")).toBe(false);
  });
  it("returns false for non-empty array", () => {
    expect(isEmpty([1])).toBe(false);
  });
  it("returns false for non-empty object", () => {
    expect(isEmpty({ a: 1 })).toBe(false);
  });
});

describe("isEqual", () => {
  it("returns true for identical primitives", () => {
    expect(isEqual(1, 1)).toBe(true);
    expect(isEqual("a", "a")).toBe(true);
  });
  it("returns true for deeply equal objects", () => {
    expect(isEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);
  });
  it("returns false for different values", () => {
    expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
  });
  it("returns false for different key sets", () => {
    expect(isEqual({ a: 1 }, { b: 1 })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Function
// ---------------------------------------------------------------------------

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

describe("throttle", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("fires immediately on first call", () => {
    const fn = jest.fn();
    const t = throttle(fn, 100);
    t();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not fire again during the cooldown period", () => {
    const fn = jest.fn();
    const t = throttle(fn, 100);
    t();
    t();
    t();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("once", () => {
  it("calls the function only once", () => {
    const fn = jest.fn((x: number) => x * 2);
    const o = once(fn);
    expect(o(5)).toBe(10);
    expect(o(99)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("returns the first-call result on every subsequent call", () => {
    let count = 0;
    const inc = once(() => ++count);
    inc();
    inc();
    expect(count).toBe(1);
  });
});

describe("memoize", () => {
  it("caches results by first argument", () => {
    const fn = jest.fn((n: number) => n * 2);
    const m = memoize(fn);
    expect(m(3)).toBe(6);
    expect(m(3)).toBe(6);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("recomputes for different arguments", () => {
    const fn = jest.fn((n: number) => n * 2);
    const m = memoize(fn);
    m(1);
    m(2);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("uses a custom resolver when provided", () => {
    const fn = jest.fn((a: number, b: number) => a + b);
    const m = memoize(fn, (a, b) => `${a},${b}`);
    expect(m(1, 2)).toBe(3);
    expect(m(1, 2)).toBe(3);
    expect(fn).toHaveBeenCalledTimes(1);
    m(2, 1);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("noop", () => {
  it("returns undefined", () => {
    expect(noop()).toBeUndefined();
  });
  it("accepts any arguments without throwing", () => {
    expect(() => noop(1, "two", {})).not.toThrow();
  });
});

describe("identity", () => {
  it("returns the value passed in", () => {
    expect(identity(42)).toBe(42);
  });
  it("returns the same object reference", () => {
    const obj = { a: 1 };
    expect(identity(obj)).toBe(obj);
  });
});

// ---------------------------------------------------------------------------
// Additional lang / clone / merge
// ---------------------------------------------------------------------------

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it("clamps to lower bound", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });
  it("clamps to upper bound", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("isArray", () => {
  it("returns true for arrays", () => {
    expect(isArray([1, 2, 3])).toBe(true);
    expect(isArray([])).toBe(true);
  });
  it("returns false for non-arrays", () => {
    expect(isArray("a")).toBe(false);
    expect(isArray({ length: 0 })).toBe(false);
    expect(isArray(null)).toBe(false);
    expect(isArray(undefined)).toBe(false);
  });
});

describe("isNumber", () => {
  it("returns true for numbers", () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(1.5)).toBe(true);
    expect(isNumber(NaN)).toBe(true);
  });
  it("returns false for non-numbers", () => {
    expect(isNumber("1")).toBe(false);
    expect(isNumber(null)).toBe(false);
    expect(isNumber(undefined)).toBe(false);
  });
});

describe("isString", () => {
  it("returns true for strings", () => {
    expect(isString("")).toBe(true);
    expect(isString("a")).toBe(true);
  });
  it("returns false for non-strings", () => {
    expect(isString(1)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString({})).toBe(false);
  });
});

describe("upperFirst", () => {
  it("uppercases the first character", () => {
    expect(upperFirst("hello")).toBe("Hello");
  });
  it("leaves the rest untouched", () => {
    expect(upperFirst("hELLO")).toBe("HELLO");
  });
  it("returns empty string for empty input", () => {
    expect(upperFirst("")).toBe("");
  });
});

describe("cloneDeep", () => {
  it("returns primitives as-is", () => {
    expect(cloneDeep(1)).toBe(1);
    expect(cloneDeep("a")).toBe("a");
    expect(cloneDeep(null)).toBe(null);
    expect(cloneDeep(undefined)).toBe(undefined);
  });
  it("deep-clones plain objects", () => {
    const src = { a: 1, b: { c: 2 } };
    const clone = cloneDeep(src);
    expect(clone).toEqual(src);
    expect(clone).not.toBe(src);
    expect(clone.b).not.toBe(src.b);
  });
  it("deep-clones arrays including nested objects", () => {
    const src = [{ a: 1 }, { a: 2 }];
    const clone = cloneDeep(src);
    expect(clone).toEqual(src);
    expect(clone).not.toBe(src);
    expect(clone[0]).not.toBe(src[0]);
  });
});

describe("merge", () => {
  it("recursively merges properties", () => {
    type Shape = { a?: number; b?: { c?: number; d?: number } };
    const result: Shape = merge<Shape>({ a: 1, b: { c: 2 } }, { b: { d: 3 } });
    expect(result).toEqual({ a: 1, b: { c: 2, d: 3 } });
  });
  it("later sources overwrite earlier ones for leaf values", () => {
    type Shape = { a?: number };
    expect(merge<Shape>({}, { a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });
  it("skips undefined source values", () => {
    type Shape = { a?: number };
    expect(merge<Shape>({ a: 1 }, { a: undefined })).toEqual({ a: 1 });
  });
  it("does not mutate the target", () => {
    type Shape = { a?: number; b?: { c?: number; d?: number } };
    const target: Shape = { a: 1, b: { c: 2 } };
    const result = merge<Shape>(target, { b: { d: 3 } });
    expect(target).toEqual({ a: 1, b: { c: 2 } });
    expect(result).not.toBe(target);
  });
  it("replaces arrays wholesale (does not merge them)", () => {
    type Shape = { a?: number[] };
    expect(merge<Shape>({ a: [1, 2, 3] }, { a: [9] })).toEqual({ a: [9] });
  });
  it("ignores null and undefined sources", () => {
    type Shape = { a?: number };
    expect(
      merge<Shape>({ a: 1 }, null as unknown as Partial<Shape>, undefined),
    ).toEqual({ a: 1 });
  });
});

describe("uniqWith", () => {
  it("removes duplicates by comparator", () => {
    const input = [
      { x: 1, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 1 },
    ];
    const eq = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      a.x === b.x && a.y === b.y;
    expect(uniqWith(input, eq)).toEqual([
      { x: 1, y: 2 },
      { x: 2, y: 1 },
    ]);
  });
  it("preserves first occurrence order", () => {
    expect(uniqWith([1, 2, 1, 3, 2], (a, b) => a === b)).toEqual([1, 2, 3]);
  });
  it("returns empty array for empty input", () => {
    expect(uniqWith([], () => true)).toEqual([]);
  });
});
