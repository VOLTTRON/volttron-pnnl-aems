/* eslint import/no-webpack-loader-syntax: off */

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
};

/**
 * Parse a json object and resolve all of the reference pointers.
 * Only absolute pointers are supported.
 * References must not be circular.
 *
 * @param schema the json object
 * @returns a dereferenced copy of the schema
 */
export const parse = (schema) => {
  return new Promise((resolve, reject) => {
    import("./json").then((json) => {
      try {
        const response = json.parse(schema);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  });
};
