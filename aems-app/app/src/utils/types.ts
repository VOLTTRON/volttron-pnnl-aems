/**
 * @fileoverview Typescript types and interfaces
 */

/**
 * Partial type with deep properties
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Set only some properties as required
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
