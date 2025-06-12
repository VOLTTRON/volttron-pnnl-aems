import { get, isArray, isEqual, isNil, isObject, range, union } from "lodash";
import { DeepTyped, DeepPartial } from "./types";

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

const isArrayType = (value: any): value is any[] | null | undefined => isArray(value) || isNil(value);

const isObjectType = (value: any): value is object | null | undefined => isObject(value) || isNil(value);

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
  if (isEqual(a, b)) {
    return undefined;
  } else if (isNil(b)) {
    return Removed;
  } else if (isArrayType(a) && isArrayType(b)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return range(Math.max(a?.length || 0, b?.length || 0)).map((i) => getDifference(a?.[i], b?.[i])) as
      | (DeepTyped<A, typeof Removed> & DeepPartial<B>)
      | undefined;
  } else if (isObjectType(a) && isObjectType(b)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-redundant-type-constituents
    const diff = {} as (DeepTyped<A, typeof Removed> & DeepPartial<B>) & any;
    for (const key of union(Object.keys(a ?? {}), Object.keys(b ?? {}))) {
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return template.replace(/{([^{}]+)}/g, (v, k) => get(props, k));
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
            ? "********"
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

export const delay = (d: number) => new Promise((r) => setTimeout(r, d));
