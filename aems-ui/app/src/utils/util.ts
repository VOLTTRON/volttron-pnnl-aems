import { get, isArray } from "lodash";

export const getFirstValue = (value: string[] | string | undefined) => (isArray(value) ? value[0] ?? "" : value);

/**
 * Recursively applies Object.freeze() to an object.
 */
export function deepFreeze(object: any) {
  const propNames = Reflect.ownKeys(object);
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
  return tasks.reduce((chain: Promise<any>, task) => {
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
