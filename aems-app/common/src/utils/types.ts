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
 * Nullable type with deep properties
 */
export type DeepNullable<T> = T extends object
  ? {
      [P in keyof T]: DeepNullable<T[P]> | null;
    }
  : T | null;

/**
 * Add a type to all properties
 */
export type DeepTyped<T, X> = T extends object
  ? {
      [P in keyof T]: DeepTyped<T[P], X> | X;
    }
  : T | X;

/**
 * Set only some properties as required
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
