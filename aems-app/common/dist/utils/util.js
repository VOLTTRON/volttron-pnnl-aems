"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chainable = exports.Chainable = exports.toOrdinal = exports.delay = exports.printEnvironment = exports.templateFormat = exports.parseBoolean = exports.getDifference = exports.Removed = exports.typeofArray = exports.typeofSymbol = exports.typeofFunction = exports.typeofBoolean = exports.typeofNumber = exports.typeofString = exports.typeofObject = exports.typeofEnum = exports.keyofObject = exports.typeofNonNullable = void 0;
exports.deepFreeze = deepFreeze;
const lodash_1 = require("lodash");
const typeofNonNullable = (value) => value !== null && value !== undefined;
exports.typeofNonNullable = typeofNonNullable;
const keyofObject = (key) => true;
exports.keyofObject = keyofObject;
const typeofEnum = (type) => (value) => Object.values(type).includes(value);
exports.typeofEnum = typeofEnum;
const typeofObject = (value, callback) => typeof value === "object" && (callback ? callback(value) : true);
exports.typeofObject = typeofObject;
const typeofString = (value) => typeof value === "string";
exports.typeofString = typeofString;
const typeofNumber = (value) => typeof value === "number";
exports.typeofNumber = typeofNumber;
const typeofBoolean = (value) => typeof value === "boolean";
exports.typeofBoolean = typeofBoolean;
const typeofFunction = (value) => typeof value === "function";
exports.typeofFunction = typeofFunction;
const typeofSymbol = (value) => typeof value === "symbol";
exports.typeofSymbol = typeofSymbol;
const typeofArray = (value) => Array.isArray(value);
exports.typeofArray = typeofArray;
function deepFreeze(object) {
    const propNames = Reflect.ownKeys(object);
    for (const name of propNames) {
        const value = object[name];
        if (value && typeof value === "object") {
            deepFreeze(value);
        }
    }
    return Object.freeze(object);
}
exports.Removed = Symbol("Removed");
const isArrayType = (value) => (0, lodash_1.isArray)(value) || (0, lodash_1.isNil)(value);
const isObjectType = (value) => (0, lodash_1.isObject)(value) || (0, lodash_1.isNil)(value);
const getDifference = (a, b) => {
    if ((0, lodash_1.isEqual)(a, b)) {
        return undefined;
    }
    else if ((0, lodash_1.isNil)(b)) {
        return exports.Removed;
    }
    else if (isArrayType(a) && isArrayType(b)) {
        return (0, lodash_1.range)(Math.max(a?.length || 0, b?.length || 0)).map((i) => (0, exports.getDifference)(a?.[i], b?.[i]));
    }
    else if (isObjectType(a) && isObjectType(b)) {
        const diff = {};
        for (const key of (0, lodash_1.union)(Object.keys(a ?? {}), Object.keys(b ?? {}))) {
            const value = (0, exports.getDifference)(a?.[key], b?.[key]);
            if (value !== undefined) {
                diff[key] = value;
            }
        }
        return Object.keys(diff).length ? diff : undefined;
    }
    else {
        return b;
    }
};
exports.getDifference = getDifference;
const parseBoolean = (value) => (value ? /^\s*true|yes|t|y|1\s*$/i.test(value) : false);
exports.parseBoolean = parseBoolean;
const templateFormat = (template, props) => {
    return template.replace(/{([^{}]+)}/g, (v, k) => (0, lodash_1.get)(props, k));
};
exports.templateFormat = templateFormat;
const printEnvironment = (options) => {
    const { printable, stringify } = options ?? {};
    const env = Object.entries(process.env)
        .filter(([k, _v]) => /^[A-Z_]+$/.test(k))
        .reduce((a, [k, v]) => ({
        ...a,
        [k]: `${/password|secret/i.test(k)
            ? ["SeT_tHiS_iN_0x3A-.env.secrets-"].includes(v ?? "")
                ? `\x1b[31mWARNING\x1b[0m: Value should be changed for production!`
                : "********"
            : /uri|url|path/i.test(k) && /:([^:@]+)@/i.test(v ?? "")
                ? /^(.*:)([^:@]+)(@.*)$/i
                    .exec(v ?? "")
                    ?.slice(1)
                    .map((v, i) => (i === 1 ? "********" : v))
                    .join("")
                : v}`,
    }), {});
    (printable ?? console.log)(stringify ? stringify(env) : JSON.stringify(env, undefined, 2));
};
exports.printEnvironment = printEnvironment;
const delay = (d) => new Promise((r) => setTimeout(r, d));
exports.delay = delay;
const toOrdinal = (n) => {
    if (!Number.isInteger(n) || n < 1) {
        throw new TypeError("Input must be a positive finite number.");
    }
    const suffixes = ["th", "st", "nd", "rd"];
    const number = Math.floor(Math.abs(n));
    const v = number % 100;
    return `${number.toLocaleString()}${suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]}`;
};
exports.toOrdinal = toOrdinal;
class Chainable {
    constructor(value) {
        this.value = value;
    }
    next(fn) {
        return new Chainable(fn(this.value));
    }
    end() {
        return this.value;
    }
}
exports.Chainable = Chainable;
const chainable = (value) => new Chainable(value);
exports.chainable = chainable;
//# sourceMappingURL=util.js.map