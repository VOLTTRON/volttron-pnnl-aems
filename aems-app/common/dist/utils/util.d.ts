import { DeepTyped, DeepPartial } from "./types";
export declare const typeofNonNullable: <T>(value: T) => value is NonNullable<T>;
export declare const keyofObject: <T extends object>(key: string | number | symbol) => key is keyof T;
export declare const typeofEnum: <T extends object>(type: T) => (value: any) => value is T[keyof T];
export declare const typeofObject: <T extends object>(value: any, callback?: (v: any) => boolean) => value is T;
export declare function deepFreeze<T extends object>(object: T): Readonly<T>;
export declare const Removed: unique symbol;
export declare const getDifference: <A, B>(a: A, b: B) => (DeepTyped<A, typeof Removed> & DeepPartial<B>) | A | B | typeof Removed | undefined;
export declare const parseBoolean: (value?: string) => boolean;
export declare const templateFormat: (template: string, props: any) => string;
export declare const printEnvironment: (options?: {
    printable?: (message: any) => void;
    stringify?: (values: any) => string;
}) => void;
export declare const delay: (d: number) => Promise<unknown>;
export declare const toOrdinal: (n: number) => string;
