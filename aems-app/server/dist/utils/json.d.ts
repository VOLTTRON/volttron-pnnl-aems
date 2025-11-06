export interface EofToken {
    type: "eof";
    value: "";
}
export interface RootToken {
    type: "root";
    value: "$";
}
export interface ObjectToken {
    type: "object";
    value: ".";
}
export interface ArrayToken {
    type: "array";
    value: "[]";
    index: number;
}
export interface FieldToken {
    type: "field";
    value: string;
}
export interface IndexToken {
    type: "index";
    value: number;
}
export interface WildcardToken {
    type: "wildcard";
    value: "*";
}
export interface SetToken {
    type: "set";
    value: number[];
}
export interface RangeToken {
    type: "range";
    value: [number, number];
}
export type JsonPathToken = EofToken | RootToken | ObjectToken | ArrayToken | FieldToken | IndexToken | WildcardToken | SetToken | RangeToken;
export declare function tokenFactory(token: string): RootToken | ObjectToken | ArrayToken | FieldToken | IndexToken | WildcardToken | SetToken | RangeToken;
export declare function tokenize(path: string): JsonPathToken[];
export declare class StreamingJsonReader {
    private path;
    private watcher;
    private stream;
    private error;
    constructor(path: string);
    private checkError;
    private initialize;
    read<T = any>(path: string, typer?: (v: any) => v is T): AsyncGenerator<T>;
    private close;
}
