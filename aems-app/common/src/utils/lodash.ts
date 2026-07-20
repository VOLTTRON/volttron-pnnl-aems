/**
 * Lodash-compatible utility functions.
 *
 * These are drop-in replacements for the most commonly used lodash imports.
 * They are intentionally NOT re-exported from the `@local/common` root barrel
 * so they don't pollute the default namespace.
 *
 * Usage:
 *   import { pick, groupBy, camelCase } from "@local/common/dist/utils/lodash";
 *
 * Drop-in migration from lodash:
 *   // Before:
 *   import { pick, groupBy, camelCase } from "lodash";
 *   // After:
 *   import { pick, groupBy, camelCase } from "@local/common/dist/utils/lodash";
 */

// ---------------------------------------------------------------------------
// Array
// ---------------------------------------------------------------------------

/**
 * Creates an object composed of the picked `keys` from `obj`.
 * Drop-in replacement for `import { pick } from "lodash"`.
 *
 * Matches lodash semantics: `obj` may be `null` / `undefined` (returns `{}`)
 * and unknown keys are silently ignored (typos in `keys` do not fail
 * typecheck).
 */
export function pick<T extends object, K extends keyof T>(obj: T | null | undefined, keys: readonly K[]): Pick<T, K>;
export function pick<T extends object>(obj: T | null | undefined, keys: readonly string[]): Partial<T>;
export function pick(obj: object | null | undefined, keys: readonly string[]): Record<string, unknown> {
  if (obj == null) return {};
  const set = new Set<string>(keys);
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).filter(([k]) => set.has(k)),
  );
}

/**
 * Creates an object without the listed `keys` from `obj`.
 * Drop-in replacement for `import { omit } from "lodash"`.
 *
 * Matches lodash semantics: `obj` may be `null` / `undefined` (returns `{}`)
 * and unknown keys are silently ignored (typos in `keys` do not fail
 * typecheck).
 */
export function omit<T extends object, K extends keyof T>(obj: T | null | undefined, keys: readonly K[]): Omit<T, K>;
export function omit<T extends object>(obj: T | null | undefined, keys: readonly string[]): Partial<T>;
export function omit(obj: object | null | undefined, keys: readonly string[]): Record<string, unknown> {
  if (obj == null) return {};
  const set = new Set<string>(keys);
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).filter(([k]) => !set.has(k)),
  );
}

/**
 * Removes falsy values (`false`, `null`, `0`, `""`, `undefined`, `NaN`) from
 * `array`.
 * Drop-in replacement for `import { compact } from "lodash"`.
 */
export function compact<T>(array: (T | null | undefined | false | 0 | "")[]): T[] {
  return array.filter(Boolean) as T[];
}

/**
 * Flattens `array` one level deep.
 * Drop-in replacement for `import { flatten } from "lodash"`.
 */
export function flatten<T>(array: (T | T[])[]): T[] {
  return array.flat() as T[];
}

/**
 * Flattens `array` recursively to any depth.
 * Drop-in replacement for `import { flattenDeep } from "lodash"`.
 */
export function flattenDeep<T>(array: unknown[]): T[] {
  return array.flat(Infinity) as T[];
}

/**
 * Creates a duplicate-free version of `array`, preserving first occurrence.
 * Drop-in replacement for `import { uniq } from "lodash"`.
 */
export function uniq<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Like `uniq` but uses an `iteratee` to compute the uniqueness key.
 * Drop-in replacement for `import { uniqBy } from "lodash"`.
 */
export function uniqBy<T>(array: T[], iteratee: (v: T) => unknown): T[] {
  const seen = new Set<unknown>();
  return array.filter((v) => {
    const k = iteratee(v);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Returns the elements of `array` that are not in `values`.
 * Drop-in replacement for `import { difference } from "lodash"`.
 */
export function difference<T>(array: T[], ...values: T[][]): T[] {
  const excluded = new Set(values.flat());
  return array.filter((x) => !excluded.has(x));
}

/**
 * Like `difference` but uses an `iteratee` to compute the comparison key.
 * Drop-in replacement for `import { differenceBy } from "lodash"`.
 */
export function differenceBy<T>(array: T[], ...rest: (T[] | ((v: T) => unknown))[]): T[] {
  const iteratee = typeof rest[rest.length - 1] === "function"
    ? (rest.pop() as (v: T) => unknown)
    : (v: T) => v;
  const excluded = new Set((rest as T[][]).flat().map(iteratee));
  return array.filter((v) => !excluded.has(iteratee(v)));
}

/**
 * Returns the intersection of two or more arrays, using strict equality.
 * Drop-in replacement for `import { intersection } from "lodash"`.
 */
export function intersection<T>(...arrays: T[][]): T[] {
  if (arrays.length === 0) return [];
  const [first, ...rest] = arrays;
  return first.filter((v) => rest.every((arr) => arr.includes(v)));
}

/**
 * Like `intersection` but uses an `iteratee` to compute the comparison key.
 * Drop-in replacement for `import { intersectionBy } from "lodash"`.
 */
export function intersectionBy<T>(array: T[], ...rest: (T[] | ((v: T) => unknown))[]): T[] {
  const iteratee = typeof rest[rest.length - 1] === "function"
    ? (rest.pop() as (v: T) => unknown)
    : (v: T) => v;
  const others = rest as T[][];
  return array.filter((v) => others.every((arr) => arr.some((x) => iteratee(x) === iteratee(v))));
}

/**
 * Creates a duplicate-free union of all given arrays, preserving order.
 * Drop-in replacement for `import { union } from "lodash"`.
 */
export function union<T>(...arrays: T[][]): T[] {
  return [...new Set(arrays.flat())];
}

/**
 * Returns the symmetric difference of two arrays using `JSON.stringify`
 * equality (handles object and tuple elements).
 * Drop-in replacement for `import { xor } from "lodash"`.
 */
export function xor<T>(a: T[], b: T[]): T[] {
  const key = (v: T) => JSON.stringify(v);
  const bKeys = new Set(b.map(key));
  const aKeys = new Set(a.map(key));
  return [
    ...a.filter((x) => !bKeys.has(key(x))),
    ...b.filter((x) => !aKeys.has(key(x))),
  ];
}

/**
 * Groups elements of `array` by the string returned by `iteratee`.
 * Drop-in replacement for `import { groupBy } from "lodash"`.
 */
export function groupBy<T>(array: T[], iteratee: (v: T) => string): Record<string, T[]> {
  return array.reduce<Record<string, T[]>>((acc, v) => {
    const k = iteratee(v);
    (acc[k] ??= []).push(v);
    return acc;
  }, {});
}

/**
 * Creates an object keyed by the result of `iteratee`; last value wins for
 * duplicate keys.
 * Drop-in replacement for `import { keyBy } from "lodash"`.
 */
export function keyBy<T>(array: T[], iteratee: (v: T) => string): Record<string, T> {
  return array.reduce<Record<string, T>>((acc, v) => {
    acc[iteratee(v)] = v;
    return acc;
  }, {});
}

/**
 * Counts elements of `array` by the string returned by `iteratee`.
 * Drop-in replacement for `import { countBy } from "lodash"`.
 */
export function countBy<T>(array: T[], iteratee: (v: T) => string): Record<string, number> {
  return array.reduce<Record<string, number>>((acc, v) => {
    const k = iteratee(v);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

/**
 * Creates an object from arrays of `keys` and `values`.
 * Drop-in replacement for `import { zipObject } from "lodash"`.
 */
export function zipObject<V>(keys: string[], values: V[]): Record<string, V> {
  return Object.fromEntries(keys.map((k, i) => [k, values[i]]));
}

/**
 * Returns the first element of `array`, or `undefined` for an empty array.
 * Drop-in replacement for `import { first } from "lodash"` / `_.head`.
 */
export function first<T>(array: T[]): T | undefined {
  return array[0];
}

/**
 * Returns the last element of `array`, or `undefined` for an empty array.
 * Drop-in replacement for `import { last } from "lodash"`.
 */
export function last<T>(array: T[]): T | undefined {
  return array[array.length - 1];
}

/**
 * Creates an array of numbers from `start` (inclusive) to `end` (exclusive),
 * incrementing by `step`.
 *
 * One-argument form: `range(end)` → `[0, 1, ..., end-1]`
 * Two-argument form: `range(start, end)` → `[start, ..., end-1]`
 * Three-argument form: `range(start, end, step)`
 *
 * Drop-in replacement for `import { range } from "lodash"`.
 */
export function range(end: number): number[];
export function range(start: number, end: number, step?: number): number[];
export function range(startOrEnd: number, end?: number, step = 1): number[] {
  const start = end === undefined ? 0 : startOrEnd;
  const stop = end === undefined ? startOrEnd : end;
  if (step === 0) throw new RangeError("range step must not be zero");
  const length = Math.max(Math.ceil((stop - start) / step), 0);
  return Array.from({ length }, (_, i) => start + i * step);
}

type SortIteratee<T> = ((v: T) => unknown) | keyof T | string;

function toIterateeFn<T>(iteratee: SortIteratee<T>): (v: T) => unknown {
  if (typeof iteratee === "function") return iteratee;
  return (v: T) => (v as Record<string, unknown>)[iteratee as string];
}

/**
 * Creates an array of elements sorted by the result of each `iteratee`.
 * Each iteratee may be a function or a property-name shortcut (`"campus"`).
 * A single iteratee array (`sortBy(arr, ["a", "b"])`) also works.
 * Drop-in replacement for `import { sortBy } from "lodash"`.
 */
export function sortBy<T>(array: T[], iteratees: SortIteratee<T>[]): T[];
export function sortBy<T>(array: T[], ...iteratees: SortIteratee<T>[]): T[];
export function sortBy<T>(array: T[], ...args: (SortIteratee<T> | SortIteratee<T>[])[]): T[] {
  const flat: SortIteratee<T>[] =
    args.length === 1 && Array.isArray(args[0]) ? (args[0]) : (args as SortIteratee<T>[]);
  const fns = flat.map(toIterateeFn);
  return [...array].sort((a, b) => {
    for (const fn of fns) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const fa = fn(a) as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const fb = fn(b) as any;
      if (fa < fb) return -1;
      if (fa > fb) return 1;
    }
    return 0;
  });
}

/**
 * Like `sortBy` but supports `"asc"` / `"desc"` per iteratee.
 * Each iteratee may be a function or a property-name shortcut.
 * Drop-in replacement for `import { orderBy } from "lodash"`.
 */
export function orderBy<T>(
  array: T[],
  iteratees: SortIteratee<T>[],
  orders: ("asc" | "desc")[],
): T[] {
  const fns = iteratees.map(toIterateeFn);
  return [...array].sort((a, b) => {
    for (let i = 0; i < fns.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const fa = fns[i](a) as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const fb = fns[i](b) as any;
      const dir = orders[i] === "desc" ? -1 : 1;
      if (fa < fb) return -1 * dir;
      if (fa > fb) return 1 * dir;
    }
    return 0;
  });
}

/**
 * Splits `array` into chunks of `size`. The last chunk may be smaller.
 * Drop-in replacement for `import { chunk } from "lodash"`.
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size < 1) return [];
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) result.push(array.slice(i, i + size));
  return result;
}

/**
 * Returns the maximum value in `array`, or `undefined` for an empty array.
 * Drop-in replacement for `import { max } from "lodash"`.
 */
export function max(array: number[]): number | undefined {
  return array.length ? array.reduce((a, b) => (a > b ? a : b)) : undefined;
}

/**
 * Like `max` but uses an `iteratee` to compute each element's rank.
 * Drop-in replacement for `import { maxBy } from "lodash"`.
 */
export function maxBy<T>(array: T[], iteratee: (v: T) => number): T | undefined {
  if (!array.length) return undefined;
  return array.reduce((best, v) => (iteratee(v) > iteratee(best) ? v : best));
}

/**
 * Returns the minimum value in `array`, or `undefined` for an empty array.
 * Drop-in replacement for `import { min } from "lodash"`.
 */
export function min(array: number[]): number | undefined {
  return array.length ? array.reduce((a, b) => (a < b ? a : b)) : undefined;
}

/**
 * Like `min` but uses an `iteratee` to compute each element's rank.
 * Drop-in replacement for `import { minBy } from "lodash"`.
 */
export function minBy<T>(array: T[], iteratee: (v: T) => number): T | undefined {
  if (!array.length) return undefined;
  return array.reduce((best, v) => (iteratee(v) < iteratee(best) ? v : best));
}

/**
 * Returns the sum of all numeric values in `array`. Non-numeric values are
 * skipped (matching lodash's behaviour).
 * Drop-in replacement for `import { sum } from "lodash"`.
 */
export function sum(array: readonly (number | null | undefined)[]): number {
  return array.reduce<number>((a, b) => (typeof b === "number" ? a + b : a), 0);
}

/**
 * Returns the sum of `iteratee(v)` for each element in `array`.
 * Drop-in replacement for `import { sumBy } from "lodash"`.
 */
export function sumBy<T>(array: T[], iteratee: (v: T) => number): number {
  return array.reduce((acc, v) => acc + iteratee(v), 0);
}

/**
 * Returns the arithmetic mean of `array`, or `undefined` for an empty array.
 * Drop-in replacement for `import { mean } from "lodash"`.
 */
export function mean(array: number[]): number | undefined {
  return array.length ? sum(array) / array.length : undefined;
}

/**
 * Returns the arithmetic mean of `iteratee(v)` for each element, or
 * `undefined` for an empty array.
 * Drop-in replacement for `import { meanBy } from "lodash"`.
 */
export function meanBy<T>(array: T[], iteratee: (v: T) => number): number | undefined {
  return array.length ? sumBy(array, iteratee) / array.length : undefined;
}

// ---------------------------------------------------------------------------
// Object
// ---------------------------------------------------------------------------

/**
 * Parse a dot / bracket-notation path into segments, matching lodash's
 * behaviour: `a.b[0].c` → `["a", "b", "0", "c"]`. Empty segments (produced
 * by leading brackets or repeated dots) are dropped.
 */
function parsePath(path: string | string[]): string[] {
  if (Array.isArray(path)) return path;
  return path.replace(/\[(\d+)\]/g, ".$1").split(".").filter((k) => k !== "");
}

/**
 * Gets the value at `path` of `obj`, returning `defaultValue` when the result
 * is `undefined`. Supports dot-notation and bracket notation paths.
 * Drop-in replacement for `import { get } from "lodash"`.
 */
export function get<T = unknown>(obj: unknown, path: string | string[], defaultValue?: T): T {
  const keys = parsePath(path);
  let value: unknown = obj;
  for (const key of keys) {
    if (value == null) return defaultValue as T;
    value = (value as Record<string, unknown>)[key];
  }
  return (value === undefined ? defaultValue : value) as T;
}

/**
 * Sets `value` at `path` of `obj` (mutates in place) and returns `obj`.
 * Supports dot-notation and bracket notation paths.
 * Drop-in replacement for `import { set } from "lodash"`.
 */
export function set<T extends object>(obj: T, path: string | string[], value: unknown): T {
  const keys = parsePath(path);
  if (keys.length === 0) return obj;
  let cur: Record<string, unknown> = obj as unknown as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (cur[k] == null || typeof cur[k] !== "object") {
      cur[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    }
    cur = cur[k] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = value;
  return obj;
}

/**
 * Returns `true` when `obj` has `path` as an own (nested) property.
 * Supports dot-notation paths.
 * Drop-in replacement for `import { has } from "lodash"`.
 */
export function has(obj: unknown, path: string | string[]): boolean {
  const keys = parsePath(path);
  let cur: unknown = obj;
  for (let i = 0; i < keys.length; i++) {
    if (cur == null || typeof cur !== "object") return false;
    if (!Object.prototype.hasOwnProperty.call(cur, keys[i])) return false;
    if (i < keys.length - 1) cur = (cur as Record<string, unknown>)[keys[i]];
  }
  return true;
}

/**
 * Creates an object whose keys are transformed by `iteratee`.
 * Drop-in replacement for `import { mapKeys } from "lodash"`.
 */
export function mapKeys<T>(obj: Record<string, T>, iteratee: (v: T, k: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [iteratee(v, k), v]));
}

/**
 * Creates an object whose values are transformed by `iteratee`.
 * Drop-in replacement for `import { mapValues } from "lodash"`.
 */
export function mapValues<T, U>(obj: Record<string, T>, iteratee: (v: T, k: string) => U): Record<string, U> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, iteratee(v, k)]));
}

/**
 * Creates an object whose keys and values are swapped.
 * Drop-in replacement for `import { invert } from "lodash"`.
 */
export function invert<T extends Record<string, string | number>>(obj: T): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));
}

/**
 * Assigns own enumerable properties of `sources` to `obj` only for keys where
 * `obj`'s value is `undefined` (does not overwrite existing values).
 * Drop-in replacement for `import { defaults } from "lodash"`.
 */
export function defaults<T extends object>(obj: T, ...sources: Partial<T>[]): T {
  for (const source of sources) {
    for (const key of Object.keys(source) as (keyof T)[]) {
      if (obj[key] === undefined) obj[key] = source[key] as T[keyof T];
    }
  }
  return obj;
}

/**
 * Creates an object with only the properties for which `predicate` returns
 * truthy (defaults to `Boolean`).
 * Drop-in replacement for `import { pickBy } from "lodash"`.
 */
export function pickBy<T extends object>(
  obj: T,
  predicate: (v: T[keyof T], k: string) => boolean = (v): boolean => Boolean(v),
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([k, v]) => predicate(v as T[keyof T], k)),
  ) as Partial<T>;
}

/**
 * Creates an object without the properties for which `predicate` returns
 * truthy.
 * Drop-in replacement for `import { omitBy } from "lodash"`.
 */
export function omitBy<T extends object>(
  obj: T,
  predicate: (v: T[keyof T], k: string) => boolean,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([k, v]) => !predicate(v as T[keyof T], k)),
  ) as Partial<T>;
}

// ---------------------------------------------------------------------------
// String
// ---------------------------------------------------------------------------

/**
 * Splits `str` into an array of case-preserving words, matching lodash's
 * `words` behaviour for ASCII input:
 *   "ABCDef" → ["ABC", "Def"]
 *   "Ahu1"   → ["Ahu", "1"]
 *   "foo bar-baz" → ["foo", "bar", "baz"]
 */
function words(str: string): string[] {
  const pattern = /[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|[0-9]+/g;
  return str.match(pattern) ?? [];
}

/**
 * Converts `str` to camelCase.
 * Drop-in replacement for `import { camelCase } from "lodash"`.
 */
export function camelCase(str: string): string {
  return words(str)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join("");
}

/**
 * Converts `str` to snake_case.
 * Drop-in replacement for `import { snakeCase } from "lodash"`.
 */
export function snakeCase(str: string): string {
  return words(str)
    .map((w) => w.toLowerCase())
    .join("_");
}

/**
 * Converts `str` to kebab-case.
 * Drop-in replacement for `import { kebabCase } from "lodash"`.
 */
export function kebabCase(str: string): string {
  return words(str)
    .map((w) => w.toLowerCase())
    .join("-");
}

/**
 * Uppercases the first character of `str` and lowercases the rest.
 * Drop-in replacement for `import { capitalize } from "lodash"`.
 */
export function capitalize(str: string): string {
  return str.length === 0 ? "" : str[0].toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Converts `str` to Start Case (each word's first letter uppercased).
 * Drop-in replacement for `import { startCase } from "lodash"`.
 */
export function startCase(str: string): string {
  return words(str)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Truncates `str` to `length` characters, appending `omission` when truncated.
 * Drop-in replacement for `import { truncate } from "lodash"`.
 */
export function truncate(str: string, options: { length?: number; omission?: string } = {}): string {
  const { length = 30, omission = "..." } = options;
  if (str.length <= length) return str;
  return str.slice(0, length - omission.length) + omission;
}

/**
 * Repeats `str` `n` times.
 * Drop-in replacement for `import { repeat } from "lodash"`.
 */
export function repeat(str: string, n: number): string {
  return str.repeat(Math.max(0, Math.floor(n)));
}

/**
 * Pads `str` on both sides to `length` with `chars`.
 * Drop-in replacement for `import { pad } from "lodash"`.
 */
export function pad(str: string, length: number, chars = " "): string {
  const totalPad = Math.max(0, length - str.length);
  const leftPad = Math.floor(totalPad / 2);
  const rightPad = totalPad - leftPad;
  const padStr = chars.repeat(Math.ceil(length / chars.length));
  return padStr.slice(0, leftPad) + str + padStr.slice(0, rightPad);
}

// ---------------------------------------------------------------------------
// Lang / type predicates
// ---------------------------------------------------------------------------

/**
 * Returns `true` when `value` is `null` or `undefined`.
 * Drop-in replacement for `import { isNil } from "lodash"`.
 */
export const isNil = (value: unknown): value is null | undefined => value == null;

/**
 * Returns `true` when `value` is a non-null object (includes arrays,
 * functions, Dates, etc. — matching lodash's behaviour).
 * Drop-in replacement for `import { isObject } from "lodash"`.
 */
export const isObject = (value: unknown): value is object =>
  typeof value === "object" && value !== null;

/**
 * Returns `true` when `value` is a plain object (created by `{}` or
 * `Object.create(null)`).
 * Drop-in replacement for `import { isPlainObject } from "lodash"`.
 */
export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value) as object | null;
  return proto === null || proto === Object.prototype;
};

/**
 * Returns `true` when `value` is empty:
 * - `null` / `undefined` / empty string → true
 * - arrays / strings: length === 0
 * - plain objects: no own keys
 * Drop-in replacement for `import { isEmpty } from "lodash"`.
 */
export const isEmpty = (value: unknown): boolean => {
  if (value == null) return true;
  if (Array.isArray(value) || typeof value === "string") return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

/**
 * Returns `true` when `a` and `b` are deeply equal (JSON-serialisable values).
 * Drop-in replacement for `import { isEqual } from "lodash"` in the common case.
 */
export const isEqual = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

// ---------------------------------------------------------------------------
// Function
// ---------------------------------------------------------------------------

/**
 * Creates a debounced version of `fn` that delays invocation by `ms` ms.
 * Drop-in replacement for `import { debounce } from "lodash"`.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let id: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  }) as T;
}

/**
 * Creates a throttled version of `fn` that fires at most once per `ms` ms
 * (leading-edge; calls during cooldown are dropped).
 * Drop-in replacement for `import { throttle } from "lodash"`.
 */
export function throttle<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let last = -Infinity;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  }) as T;
}

/**
 * Creates a function that is called at most once; subsequent calls return the
 * result of the first invocation.
 * Drop-in replacement for `import { once } from "lodash"`.
 */
export function once<T extends (...args: any[]) => any>(fn: T): T {
  let called = false;
  let result: ReturnType<T>;
  return ((...args: Parameters<T>) => {
    if (!called) {
      called = true;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      result = fn(...args);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
  }) as T;
}

/**
 * Creates a memoized version of `fn`. The cache key defaults to the first
 * argument; pass `resolver` to customise it.
 * Drop-in replacement for `import { memoize } from "lodash"`.
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  resolver?: (...args: Parameters<T>) => unknown,
): T {
  const cache = new Map<unknown, ReturnType<T>>();
  return ((...args: Parameters<T>) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const key = resolver ? resolver(...args) : args[0];
     
    if (cache.has(key)) return cache.get(key);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = fn(...args);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    cache.set(key, result);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
  }) as T;
}

/**
 * A no-op function.
 * Drop-in replacement for `import { noop } from "lodash"`.
 */
export const noop = (..._args: unknown[]): void => {};

/**
 * Returns the first argument it receives.
 * Drop-in replacement for `import { identity } from "lodash"`.
 */
export function identity<T>(value: T): T {
  return value;
}

// ---------------------------------------------------------------------------
// Additional lang / clone / merge helpers
// ---------------------------------------------------------------------------

/**
 * Clamps `value` between `lower` and `upper` (inclusive).
 * Drop-in replacement for `import { clamp } from "lodash"`.
 */
export function clamp(value: number, lower: number, upper: number): number {
  return Math.min(Math.max(value, lower), upper);
}

/**
 * Returns `true` when `value` is an array. Type predicate; matches
 * lodash `isArray` semantics.
 * Drop-in replacement for `import { isArray } from "lodash"`.
 */
export const isArray = (value: unknown): value is unknown[] => Array.isArray(value);

/**
 * Returns `true` when `value` is a finite JS number. Matches lodash: `NaN`
 * returns `true` (because `typeof NaN === "number"`).
 * Drop-in replacement for `import { isNumber } from "lodash"`.
 */
export const isNumber = (value: unknown): value is number => typeof value === "number";

/**
 * Returns `true` when `value` is a string primitive.
 * Drop-in replacement for `import { isString } from "lodash"`.
 */
export const isString = (value: unknown): value is string => typeof value === "string";

/**
 * Uppercases the first character of `str`, leaving the rest unchanged.
 * Drop-in replacement for `import { upperFirst } from "lodash"`.
 */
export function upperFirst(str: string): string {
  return str.length === 0 ? "" : str[0].toUpperCase() + str.slice(1);
}

/**
 * Deep-clones a JSON-serialisable value. Handles plain objects, arrays,
 * primitives, `null`, and `undefined` (Dates, Maps, Sets, class instances,
 * functions, and cyclic refs are NOT supported — matching what consumers
 * use `cloneDeep` for here).
 * Drop-in replacement for `import { cloneDeep } from "lodash"` for the
 * common case.
 */
export function cloneDeep<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return (value as unknown[]).map((v) => cloneDeep(v)) as unknown as T;
  }
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>)) {
    out[key] = cloneDeep((value as Record<string, unknown>)[key]);
  }
  return out as T;
}

/**
 * Recursively merges own enumerable properties of `sources` into a new object
 * (returned value; `target` is NOT mutated — differs from lodash's mutating
 * `_.merge` but matches every consumer here, which all use the
 * `merge({}, a, b)` idiom). Later sources overwrite earlier ones; nested
 * plain-object values are merged, everything else is replaced by reference.
 * Drop-in replacement for `import { merge } from "lodash"` in the
 * common case.
 *
 * The return type is the intersection of the target and every source
 * (matching lodash), so `merge({}, a, b)` returns `a & b`.
 */
export function merge<T extends object, S1 extends object>(
  target: T | null | undefined,
  source1: S1 | null | undefined,
): T & S1;
export function merge<T extends object, S1 extends object, S2 extends object>(
  target: T | null | undefined,
  source1: S1 | null | undefined,
  source2: S2 | null | undefined,
): T & S1 & S2;
export function merge<T extends object, S1 extends object, S2 extends object, S3 extends object>(
  target: T | null | undefined,
  source1: S1 | null | undefined,
  source2: S2 | null | undefined,
  source3: S3 | null | undefined,
): T & S1 & S2 & S3;
export function merge<T extends object>(
  target: T | null | undefined,
  ...sources: (object | null | undefined)[]
): T;
export function merge(
  target: object | null | undefined,
  ...sources: (object | null | undefined)[]
): object {
  const result = (cloneDeep(target ?? {}) ?? {}) as Record<string, unknown>;
  for (const source of sources) {
    if (!source) continue;
    for (const key of Object.keys(source)) {
      const sv = (source as Record<string, unknown>)[key];
      const tv = result[key];
      if (
        sv &&
        typeof sv === "object" &&
        !Array.isArray(sv) &&
        tv &&
        typeof tv === "object" &&
        !Array.isArray(tv)
      ) {
        result[key] = merge(tv, sv);
      } else if (sv !== undefined) {
        result[key] = cloneDeep(sv);
      }
    }
  }
  return result;
}

/**
 * Creates a duplicate-free version of `array` using the `comparator` to
 * compare elements. First occurrence wins.
 * Drop-in replacement for `import { uniqWith } from "lodash"`.
 */
export function uniqWith<T>(array: T[], comparator: (a: T, b: T) => boolean): T[] {
  const result: T[] = [];
  for (const value of array) {
    if (!result.some((seen) => comparator(seen, value))) {
      result.push(value);
    }
  }
  return result;
}
