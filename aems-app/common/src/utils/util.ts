import { DeepTyped, DeepPartial } from "./types";

/**
 * Creates an object composed of the picked `keys` from `obj`.
 * Drop-in replacement for `import { pick } from "lodash"`.
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return Object.fromEntries(
    keys.filter((k) => k in obj).map((k) => [k, obj[k]]),
  ) as Pick<T, K>;
}

/**
 * Creates an object without the listed `keys` from `obj`.
 * Drop-in replacement for `import { omit } from "lodash"`.
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !(keys as readonly string[]).includes(k)),
  ) as Omit<T, K>;
}

/**
 * Returns the symmetric difference of two arrays — elements present in
 * exactly one of the two arrays.
 *
 * Uses `JSON.stringify` equality so it handles object / tuple elements.
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
 * Returns the symmetric difference of two primitive arrays (string / number /
 * boolean) using strict equality — faster than `xor` for non-object arrays.
 * Drop-in for patterns like `xor(stringArray, [value])`.
 */
export function xorPrimitive<T extends string | number | boolean>(a: T[], b: T[]): T[] {
  return [...a.filter((x) => !b.includes(x)), ...b.filter((x) => !a.includes(x))];
}

/**
 * Creates a debounced version of `fn` that delays invocation by `ms`
 * milliseconds.  Each new call resets the timer.
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
 * Splits `array` into chunks of `size`.  The last chunk may be smaller.
 * Drop-in replacement for `import { chunk } from "lodash"`.
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size < 1) return [];
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) result.push(array.slice(i, i + size));
  return result;
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
 * Creates a duplicate-free union of all given arrays, preserving order.
 * Drop-in replacement for `import { union } from "lodash"`.
 */
export function union<T>(...arrays: T[][]): T[] {
  return [...new Set(arrays.flat())];
}

/**
 * Creates an array of elements sorted by the result of `iteratee`.
 * Drop-in replacement for `import { sortBy } from "lodash"`.
 */
export function sortBy<T>(array: T[], ...iteratees: ((v: T) => unknown)[]): T[] {
  return [...array].sort((a, b) => {
    for (const fn of iteratees) {
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
 * Returns the maximum value in `array`, or `undefined` for an empty array.
 * Drop-in replacement for `import { max } from "lodash"`.
 */
export function max(array: number[]): number | undefined {
  return array.length ? array.reduce((a, b) => (a > b ? a : b)) : undefined;
}

// ---------------------------------------------------------------------------

export function deepMerge(...sources: (object | null | undefined)[]): any;
export function deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T;
export function deepMerge<T extends object>(target?: T | null, ...sources: (Partial<T> | null | undefined)[]): T {
  const result = { ...(target ?? {}) } as T;
  for (const source of sources) {
    if (!source) continue;
    for (const key of Object.keys(source) as (keyof T)[]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const sv = (source as any)[key];
      const tv = result[key];
      if (sv && typeof sv === "object" && !Array.isArray(sv) && tv && typeof tv === "object" && !Array.isArray(tv)) {
        result[key] = deepMerge(tv as object, sv as object) as T[keyof T];
      } else if (sv !== undefined) {
        result[key] = sv as T[keyof T];
      }
    }
  }
  return result;
}

/**
 * Type guard for non null or undefined value.
 */
export const typeofNonNullable = <T>(value: T): value is NonNullable<T> => value !== null && value !== undefined;

/**
 * Type guard for object keys.
 */
export const keyofObject = <T extends object>(key: string | number | symbol): key is keyof T => true;

/**
 * Type guard for enumeration types.
 */
export const typeofEnum =
  <T extends object>(type: T) =>
  (value: any): value is T[keyof T] =>
    Object.values(type).includes(value as T[keyof T]);

/**
 * Type guard for object.
 */
export const typeofObject = <T extends object>(value: any, callback?: (v: any) => boolean): value is T =>
  typeof value === "object" && (callback ? callback(value) : true);

/**
 * Type guard for string.
 */
export const typeofString = (value: any): value is string => typeof value === "string";

/**
 * Type guard for number.
 */
export const typeofNumber = (value: any): value is number => typeof value === "number";

/** Type guard for boolean. */
export const typeofBoolean = (value: any): value is boolean => typeof value === "boolean";

/** Type guard for function. */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const typeofFunction = (value: any): value is Function => typeof value === "function";

/** Type guard for symbol. */
export const typeofSymbol = (value: any): value is symbol => typeof value === "symbol";

/** Type guard for array. */
export const typeofArray = (value: any): value is any[] => Array.isArray(value);

/**
 * Recursively applies Object.freeze() to an object.
 */
export function deepFreeze<T extends object>(object: T) {
  type P = keyof typeof object;
  const propNames = Reflect.ownKeys(object) as P[];
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

/**
 * Marks a value as removed.
 */
export const Removed = Symbol("Removed");

const isArrayType = (value: any): value is any[] | null | undefined => Array.isArray(value) || value == null;

const isObjectType = (value: any): value is object | null | undefined =>
  (typeof value === "object" && value !== null) || value == null;

/**
 * Get the difference between two values.
 * The result will be a new value with the differences shown as follows:
 * - If a property is removed, the value will be `Removed`.
 * - If a property is added, the value will be the new value.
 * - If a property is updated, the value will be the new value.
 * - If a property is unchanged, the value will be `undefined`.
 * - If a property is an array, the value will be an array of differences.
 *
 * @param a the original value
 * @param b the updated value
 * @returns the difference between the two values
 */
export const getDifference = <A, B>(
  a: A,
  b: B,
): (DeepTyped<A, typeof Removed> & DeepPartial<B>) | A | B | typeof Removed | undefined => {
  if (JSON.stringify(a) === JSON.stringify(b)) {
    return undefined;
  } else if (b == null) {
    return Removed;
  } else if (isArrayType(a) && isArrayType(b)) {
    return Array.from({ length: Math.max(a?.length || 0, b?.length || 0) }, (_, i) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      getDifference(a?.[i], b?.[i])
    ) as
      | (DeepTyped<A, typeof Removed> & DeepPartial<B>)
      | undefined;
  } else if (isObjectType(a) && isObjectType(b)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-redundant-type-constituents
    const diff = {} as (DeepTyped<A, typeof Removed> & DeepPartial<B>) & any;
    for (const key of [...new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])]) {
      const value = getDifference(a?.[key as keyof A], b?.[key as keyof B]);
      if (value !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        diff[key] = value;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
    return Object.keys(diff).length ? diff : undefined;
  } else {
    return b;
  }
};

/**
 * Parse a string and return a boolean value.
 */
export const parseBoolean = (value?: string) => (value ? /^\s*true|yes|t|y|1\s*$/i.test(value) : false);

/**
 * Parse the template and replace all {enclosed} entries with the corresponding property.
 */
export const templateFormat = (template: string, props: any) => {
   
  return template.replace(/{([^{}]+)}/g, (_v, k: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return k.split(".").reduce((obj: any, part) => obj?.[part], props);
  });
};

/**
 * Log the current environment on startup and replace any sensitive values with fixed length asterisks.
 *
 * @param options.printable Optional function to print the environment instead of console log.
 * @param options.stringify Optional function to stringify the environment instead of JSON.stringify.
 */
export const printEnvironment = (options?: {
  printable?: (message: any) => void;
  stringify?: (values: any) => string;
}) => {
  const { printable, stringify } = options ?? {};
  const env = Object.entries(process.env)
    .filter(([k, _v]) => /^[A-Z_]+$/.test(k))
    .reduce(
      (a, [k, v]) => ({
        ...a,
        [k]: `${
          /password|secret/i.test(k)
            ? ["SeT_tHiS_iN_0x3A-.env.secrets-"].includes(v ?? "")
              ? `\x1b[31mWARNING\x1b[0m: Value should be changed for production!`
              : "********"
            : /uri|url|path/i.test(k) && /:([^:@]+)@/i.test(v ?? "")
              ? /^(.*:)([^:@]+)(@.*)$/i
                  .exec(v ?? "")
                  ?.slice(1)
                  .map((v, i) => (i === 1 ? "********" : v))
                  .join("")
              : v
        }`,
      }),
      {} as Record<string, string>,
    );
  (printable ?? console.log)(stringify ? stringify(env) : JSON.stringify(env, undefined, 2));
};

/**
 * Delay the execution for a given number of milliseconds.
 *
 * @param d The delay in milliseconds.
 * @returns A promise that resolves after the delay.
 */
export const delay = (d: number) => new Promise((r) => setTimeout(r, d));

/**
 * Convert a number to its ordinal representation (e.g., 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 4 -> "4th").
 *
 * @param n The number to convert.
 * @returns The ordinal representation of the number.
 */
export const toOrdinal = (n: number): string => {
  if (!Number.isInteger(n) || n < 1) {
    throw new TypeError("Input must be a positive finite number.");
  }
  const suffixes = ["th", "st", "nd", "rd"];
  const number = Math.floor(Math.abs(n));
  const v = number % 100;
  return `${number.toLocaleString()}${suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]}`;
};

/**
 * A simple chainable utility class to allow chaining of functions.
 * It can be used to create a chain of operations on a value.
 */
export class Chainable<T> {
  constructor(private value: T) {}

  next<U>(fn: (value: T) => U): Chainable<U> {
    return new Chainable(fn(this.value));
  }

  end(): T {
    return this.value;
  }
}

/**
 * Convenience function to create a Chainable instance.
 *
 * @param value the initial value to chain on
 * @returns A new Chainable instance with the given value.
 */
export const chainable = <T>(value: T): Chainable<T> => new Chainable(value);
