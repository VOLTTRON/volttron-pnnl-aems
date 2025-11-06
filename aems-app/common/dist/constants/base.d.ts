import { IBase, IConstant, IMatcher, IParse, IParseStrict } from ".";
declare abstract class Base<T extends IConstant> implements IBase<T> {
    private _matcher;
    private _values;
    private _constants;
    private _keys;
    constructor(values: T[], decorator?: (constant: Base<T>, value: T) => T);
    get matcher(): IMatcher;
    set matcher(matcher: IMatcher);
    get values(): T[];
    get constants(): Record<string, T>;
    parse: IParse<T>;
    parseStrict: IParseStrict<T>;
    get length(): number;
    [Symbol.iterator](): Generator<T, void, unknown>;
}
export default Base;
