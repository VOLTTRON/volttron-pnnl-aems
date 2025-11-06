export interface IAction {
    sources: string[];
    expression: string;
}
export interface IValue extends IAction {
    _type: "value";
    sources: string[];
    expression: string;
}
export interface IRemove {
    _type: "remove";
}
export interface IIterate {
    path: string;
    value: any;
}
export interface IMap extends IIterate {
    _type: "map";
}
export interface IReduce extends IIterate {
    _type: "reduce";
}
export interface IEvaluate extends IAction {
    _type: "evaluate";
    values: Record<string, any>;
}
export declare const transformTemplate: (template: any, params?: any) => any;
