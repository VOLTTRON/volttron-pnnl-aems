import { get } from "lodash";

/**
 * Type guard for object keys.
 */
export const keyofObject = <T extends {}>(key: string | number | symbol): key is keyof T => true;

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
