/* eslint import/no-webpack-loader-syntax: off */

import PromiseWorker from "promise-worker";

const unsupported = ["test"].includes(process.env.NODE_ENV || "");
const promiseWorker = !unsupported
  ? new PromiseWorker(new Worker(new URL("./async.worker.js", import.meta.url)))
  : undefined;

/**
 * Searches all of the text fields in the list of items which contain the search value.
 * Returns the complete array if search is not specified.
 * The terms are placed into a terms field which contains an array with three values: prefix, matching term, and suffix.
 * The keys array can contain either a list of fields or jsonpaths (https://www.npmjs.com/package/jsonpath).
 * Fields and jsonpaths can not be mixed. Jsonpaths must start with $.
 * @param {Array} items the list of items to filter
 * @param {String} search the search term
 * @param {Array[String]} keys an optional list of field keys to search in
 */
export const filter = (items, search, keys) => {
  if (!promiseWorker) {
    return new Promise((resolve, reject) => {
      import("./utils").then((utils) => {
        try {
          const response = utils.filter(items, search, keys);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
  return promiseWorker.postMessage({ type: "filter", items, search, keys });
};

/**
 * Parse a json object and resolve all of the reference pointers.
 * Only absolute pointers are supported.
 * References must not be circular.
 *
 * @param schema the json object
 * @param validate true to throw an error if an issue occurs
 * @returns a dereferenced copy of the schema
 */
export const parse = (schema, validate) => {
  if (!promiseWorker) {
    return new Promise((resolve, reject) => {
      import("./json").then((json) => {
        try {
          const response = json.parse(schema, validate);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
  return promiseWorker.postMessage({ type: "parse", schema });
};
