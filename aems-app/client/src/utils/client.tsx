import { cloneDeep, merge } from "lodash";

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
 * A type for the values of an object.
 */
export type valueof<T> = T[keyof T];

/**
 * A type which is not a term object.
 */
export type NotTerm<T> = T extends { terms?: any } ? never : T;

/**
 * A term object which contains the original object and a terms field.
 */
export type Term<T extends {}> = T & { terms?: Record<keyof T, [string, string, string]> };

/**
 * Renders a term with a highlight around the search term.
 */
export const renderTerm = <T extends {}, F extends keyof T>(item: Term<T>, field: F) => {
  const terms = item.terms?.[field];
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
    return <span>{String(item[field])}</span>;
  }
};

/**
 * Create a term object for rendering a term.
 */
export const getTerm = <T extends {}, F extends keyof T>(
  item: NotTerm<T>,
  field: F,
  term: string
): Record<F, [string, string, string]> => {
  const value = `${item[field]}`;
  const index = value.toLowerCase().indexOf(term);
  const temp: [string, string, string] =
    index === -1 || term.length === 0
      ? [value, "", ""]
      : [value.slice(0, index), value.slice(index, index + term.length), value.slice(index + term.length)];
  return { [field]: temp } as Record<F, [string, string, string]>;
};

const addTerm = <T extends {}, F extends keyof T>(item: NotTerm<T>, key: F, term: string) =>
  merge(item, { terms: getTerm(item, key, term) });

/**
 * Searches all of the text fields in the list of items which contain the search value.
 * Returns the complete array if search is not specified.
 * The terms are placed into a terms field which contains an array with three values: prefix, matching term, and suffix.
 */
export const filter = <T extends {}, F extends keyof T>(
  items: NotTerm<T>[],
  search: string,
  fields?: F[]
): Term<T>[] => {
  if (items.length === 0) return [];
  if (search === "") return items;
  const term = search.toLowerCase();
  return items
    .filter((item) =>
      term
        ? (fields ?? (Reflect.ownKeys(item) as F[])).find((key) => String(item[key]).toLowerCase().includes(term))
        : true
    )
    .map((item) =>
      (fields ?? (Reflect.ownKeys(item) as F[]))
        .filter((key) => String(item[key]).toLowerCase().includes(term))
        .reduce((item, key) => addTerm(item, key, term), cloneDeep(item))
    );
};
