import { every, get, isArray, isEqual, isNil, isObject, union } from "lodash";
import { DeepTyped, DeepPartial } from "./types";

/**
 * Type guard for non null or undefined value.
 */
export const typeofNonNullable = <T>(value: T): value is NonNullable<T> => value !== null && value !== undefined;

/**
 * Type guard for object keys.
 */
export const keyofObject = <T extends {}>(key: string | number | symbol): key is keyof T => true;

/**
 * Typed version of Object.keys()
 */
export const objectKeys = <T extends object>(obj: T): (keyof T)[] => {
  return Object.keys(obj) as (keyof T)[];
};

/**
 * Type guard for enumeration types.
 */
export const typeofEnum =
  <T extends {}>(type: T) =>
  (value: any): value is T[keyof T] =>
    Object.values(type).includes(value as T[keyof T]);

/**
 * Type guard for object.
 */
export const typeofObject = <T extends {}>(value: any, callback?: (v: any) => boolean): value is T =>
  typeof value === "object" && (callback ? callback(value) : true);

/**
 * Recursively applies Object.freeze() to an object.
 */
export function deepFreeze<T extends {}>(object: T) {
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
 * @param omit optional list of properties to omit
 * @returns the difference between the two values
 */
export const getDifference = <A, B>(
  a: A,
  b: B,
  omit?: string[]
): (DeepTyped<A, typeof Removed> & DeepPartial<B>) | A | B | typeof Removed | undefined => {
  if (isEqual(a, b)) {
    return undefined;
  } else if (isNil(b)) {
    return Removed;
  } else if (isArrayType(a) && isArrayType(b)) {
    // return range(Math.max(a?.length || 0, b?.length || 0)).map((i) => getDifference(a?.[i], b?.[i])) as
    //   | (DeepTyped<A, typeof Removed> & DeepPartial<B>)
    //   | undefined;
  } else if (isObjectType(a) && isObjectType(b)) {
    const diff = {} as (DeepTyped<A, typeof Removed> & DeepPartial<B>) & any;
    const keys = union(Object.keys(a ?? {}), Object.keys(b ?? {})).filter((key) => !omit?.includes(key));
    for (const key of keys) {
      const value = getDifference(a?.[key as keyof A], b?.[key as keyof B], omit);
      if (value !== undefined) {
        diff[key] = value;
      }
    }
    return Object.keys(diff).length ? diff : undefined;
  } else {
    return b;
  }
};

/**
 * Get the common values between a list of objects.
 *
 * @param objects
 * @param omit optional list of properties to omit
 */
export function getCommon<T extends object>(objects: T[], omit?: string[]): Partial<T> | undefined {
  if (objects.length === 0) {
    return undefined;
  } else if (objects.length === 1) {
    return objects[0] as Partial<T>;
  }
  const result: Partial<T> = {} as any;
  const keys = union(...objects.map((obj) => objectKeys(obj))).filter((key) => !omit?.includes(key.toString()));
  for (const key of keys) {
    const values = objects.map((o) => o[key]);
    if (every(values, (v) => isEqual(values[0], v))) {
      (result as any)[key] = values[0];
    }
  }
  return result;
}

/**
 * Parse a string and return a boolean value.
 */
export const parseBoolean = (value?: string) => (value ? /^\s*true|yes|t|y|1\s*$/i.test(value) : false);

/**
 * Parse the template and replace all {enclosed} entries with the corresponding property.
 */
export const templateFormat = (template: string, props: any) => {
  return template.replace(/{([^{}]+)}/g, (v, k) => get(props, k));
};

/**
 * Executes the list of tasks in series.
 * The result will be an array of the results.
 */
export const promiseChain = (tasks: ((r: any) => Promise<any>)[]) => {
  return tasks.reduce(async (chain: Promise<any>, task) => {
    return chain.then((results) => task(results).then((result) => [...results, result]));
  }, Promise.resolve([]));
};

/**
 * Executes the list of tasks in series.
 * The result will be the first promise to resolve.
 */
export const promiseFirst = <T>(tasks: (() => Promise<T>)[]) => {
  return new Promise<T>(async (resolve, reject) => {
    let fault;
    for (const task of tasks) {
      try {
        const result = await task();
        resolve(result);
      } catch (error) {
        fault = error;
      }
    }
    reject(fault);
  });
};

export const delay = (d: number) => new Promise((r) => setTimeout(r, d));
