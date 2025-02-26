import { assign, cloneDeep, get, isEmpty, isString } from "lodash";

import React from "react";
import jsonpath from "jsonpath";

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

export function getDocumentWidth() {
  // We always want the client width
  return Math.max(
    document.body.scrollWidth,
    // document.documentElement.scrollWidth,
    // document.body.offsetWidth,
    // document.documentElement.offsetWidth,
    document.documentElement.clientWidth
  );
}

export function getDocumentHeight() {
  // We always want the client height
  return Math.max(
    document.body.scrollHeight,
    // document.documentElement.scrollHeight,
    // document.body.offsetHeight,
    // document.documentElement.offsetHeight,
    document.documentElement.clientHeight
  );
}

/**
 * Parse a string and return a boolean value.
 *
 * @param {String} value
 */
export const parseBoolean = (value: string) => /^\s*true|yes|t|y\s*$/i.test(value);

/**
 * Log the error stack to console if running in development environment.
 * @param {Error} error
 */
export const logError = (error: Error) => {
  if (error && process.env.NODE_ENV === "development") {
    console.log(`[${error.message}]: ${error.stack}`);
  }
};

/**
 * Returns an appropriate aria-label given the element's props.
 * @param {*} props
 */
export const getAriaLabel = (props: any) => {
  const { "aria-label": ariaLabel, header, placeholder, children } = props;
  if (ariaLabel) {
    return ariaLabel;
  } else if (!isEmpty(header)) {
    return header;
  } else if (!isEmpty(placeholder)) {
    return placeholder;
  } else if (isString(children)) {
    return children;
  }
};

/**
 * Look in the list of objects and return the first value is that not undefined.
 *
 * @param path
 * @param def
 * @param objects
 * @returns
 */
export const getValue = <T, D>(path: string, def?: D, ...objects: (T | null | undefined)[]): D | undefined => {
  for (const object of objects) {
    const temp = get(object, path);
    if (temp !== undefined) {
      return temp;
    }
  }
  return def;
};

/**
 * Wraps the child component(s) only if the condition is met.
 * Requires three props: condition, wrapper, and children.
 * The condition is a boolean which determines if the wrapper should be utilized.
 * The wrapper is a callback function which passes the children elements.
 * The children are standard React children elements.
 * @param {*} props
 */
export const ConditionalWrapper = ({
  condition,
  wrapper,
  children,
}: {
  condition: boolean;
  wrapper: (children: React.ReactNode) => any;
  children: React.ReactNode;
}) => {
  return condition ? wrapper(children) : children;
};

/**
 * Create a text span for displaying a search term.
 * @param {*} item the item which may contain terms
 * @param {String} field the field to return
 */
export const createTerm = (item: any, field: string) => {
  const terms = get(item, ["terms", field]);
  if (terms) {
    return (
      <span>
        {terms[0]}
        <mark>
          <strong>{terms[1]}</strong>
        </mark>
        {terms[2]}
      </span>
    );
  } else {
    return <span>{item[field]}</span>;
  }
};

export type Key = string | number;

/**
 * Create a term object for rendering a term.
 * @param item the item with the key field
 * @param key the field key
 * @param term the search term
 * @returns the term object
 */
export const getTerm = (item: any, key: Key, term: string) => {
  const value = item[key];
  const index = isString(value) ? value.toLowerCase().indexOf(term) : -1;
  const temp =
    index === -1 || term.length === 0
      ? [value, "", ""]
      : [value.slice(0, index), value.slice(index, index + term.length), value.slice(index + term.length)];
  return { [key]: temp };
};

const addTerm = (item: any, key: Key, term: string) => {
  assign(item, { terms: getTerm(item, key, term) });
};

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
export const filter = (items: Array<any>, search: string, keys?: Array<string>) => {
  const term = search && search.length > 0 ? search.toLowerCase() : "";
  const jsonpaths = Array.isArray(keys) && keys.filter((key) => key.startsWith("$"));
  if (jsonpaths && jsonpaths.length > 0) {
    return items
      .filter((item) => {
        return jsonpaths.find((jp) => {
          const tmp = jsonpath.query(item, jp).find((v) => (isString(v) ? v.toLowerCase().includes(term) : false));
          return tmp && tmp.length > 0;
        });
      })
      .map((item) => {
        const copy = cloneDeep(item);
        jsonpaths.forEach((jp) =>
          jsonpath.nodes(copy, jp).forEach((node) => {
            if (isString(node.value) && node.value.toLowerCase().includes(term)) {
              const tmp = node.path.length <= 2 ? copy : get(copy, node.path.splice(1, node.path.length - 2));
              addTerm(tmp, node.path[node.path.length - 1], term);
            }
          })
        );
        return copy;
      });
  } else {
    const getKeys = (item: any) => (keys ? keys : Object.keys(item));
    return items
      .filter((item) =>
        term
          ? getKeys(item).find((key) => (isString(item[key]) ? item[key].toLowerCase().includes(term) : false))
          : true
      )
      .map((item) => {
        const terms = getKeys(item)
          .map((key) => {
            return getTerm(item, key, term);
          })
          .reduce((terms, term) => ({ ...terms, ...term }), {});
        return { ...item, terms };
      });
  }
};
