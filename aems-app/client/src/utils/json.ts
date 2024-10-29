import { get, has, isEmpty, isNil, isObject, isString } from "lodash";
import stripComments from "strip-json-comments";

/**
 * Parse a json object and resolve all of the reference pointers.
 * Only absolute pointers are supported.
 * References must not be circular.
 *
 * @param schema the json object
 * @param validate true to throw an error if an issue occurs
 * @returns a dereferenced copy of the schema
 */
export const parse = (schema: string | object | undefined, validate?: boolean): object | undefined => {
  if (isNil(schema) || isEmpty(schema)) {
    return;
  }
  let input = "";
  if (isString(schema)) {
    input = stripComments(schema);
  }
  if (isObject(schema)) {
    input = JSON.stringify(schema);
  }
  const ref = JSON.parse(input);
  const reviver = (k: string, v: any): any => {
    if (
      validate &&
      k === "name" &&
      !isEmpty(v) &&
      !/^([a-zA-Z_][a-zA-Z\d_]*)((\[\d+\])|(\.[a-zA-Z_][a-zA-Z\d_]*))*$/.test(v)
    ) {
      throw new Error(
        `Name field must contain only container uppercase, lowercase, underscore, dot (path), and indices (array).\nValue: "${v}"`
      );
    }
    if (has(v, ["$ref"])) {
      return get(ref, get(v, ["$ref"]).split("/").slice(1));
    }
    return v;
  };
  return JSON.parse(input, reviver);
};
