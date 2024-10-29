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
export const filter = (items: Array<any>, search: string, keys?: Array<string>): Promise<object | undefined> => {};

/**
 * Parse a json string or object and resolve all of the reference pointers.
 * Only absolute pointers are supported.
 * References must not be circular.
 * Strings may contain comments and will be stripped from the resulting Javascript.
 *
 * @param schema the json object
 * @param validate true to throw an error if an issue occurs
 * @returns a dereferenced copy of the schema
 */
export const parse = (schema: string | object | undefined, validate?: boolean): Promise<object | undefined> => {};
