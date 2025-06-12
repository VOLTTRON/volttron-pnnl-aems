export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
export type DeepNullable<T> = T extends object ? {
    [P in keyof T]: DeepNullable<T[P]> | null;
} : T | null;
export type DeepTyped<T, X> = T extends object ? {
    [P in keyof T]: DeepTyped<T[P], X> | X;
} : T | X;
export type WithRequired<T, K extends keyof T> = T & {
    [P in K]-?: T[P];
};
