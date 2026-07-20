"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chainable = exports.Chainable = exports.toOrdinal = exports.delay = exports.printEnvironment = exports.templateFormat = exports.parseBoolean = exports.getDifference = exports.Removed = exports.typeofArray = exports.typeofSymbol = exports.typeofFunction = exports.typeofBoolean = exports.typeofNumber = exports.typeofString = exports.typeofObject = exports.typeofEnum = exports.keyofObject = exports.typeofNonNullable = void 0;
exports.pick = pick;
exports.omit = omit;
exports.xor = xor;
exports.xorPrimitive = xorPrimitive;
exports.debounce = debounce;
exports.chunk = chunk;
exports.difference = difference;
exports.union = union;
exports.sortBy = sortBy;
exports.max = max;
exports.deepMerge = deepMerge;
exports.deepFreeze = deepFreeze;
function pick(obj, keys) {
    return Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));
}
function omit(obj, keys) {
    return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
}
function xor(a, b) {
    const key = (v) => JSON.stringify(v);
    const bKeys = new Set(b.map(key));
    const aKeys = new Set(a.map(key));
    return [
        ...a.filter((x) => !bKeys.has(key(x))),
        ...b.filter((x) => !aKeys.has(key(x))),
    ];
}
function xorPrimitive(a, b) {
    return [...a.filter((x) => !b.includes(x)), ...b.filter((x) => !a.includes(x))];
}
function debounce(fn, ms) {
    let id;
    return ((...args) => {
        clearTimeout(id);
        id = setTimeout(() => fn(...args), ms);
    });
}
function chunk(array, size) {
    if (size < 1)
        return [];
    const result = [];
    for (let i = 0; i < array.length; i += size)
        result.push(array.slice(i, i + size));
    return result;
}
function difference(array, ...values) {
    const excluded = new Set(values.flat());
    return array.filter((x) => !excluded.has(x));
}
function union(...arrays) {
    return [...new Set(arrays.flat())];
}
function sortBy(array, ...iteratees) {
    return [...array].sort((a, b) => {
        for (const fn of iteratees) {
            const fa = fn(a);
            const fb = fn(b);
            if (fa < fb)
                return -1;
            if (fa > fb)
                return 1;
        }
        return 0;
    });
}
function max(array) {
    return array.length ? array.reduce((a, b) => (a > b ? a : b)) : undefined;
}
function deepMerge(target, ...sources) {
    const result = { ...(target ?? {}) };
    for (const source of sources) {
        if (!source)
            continue;
        for (const key of Object.keys(source)) {
            const sv = source[key];
            const tv = result[key];
            if (sv && typeof sv === "object" && !Array.isArray(sv) && tv && typeof tv === "object" && !Array.isArray(tv)) {
                result[key] = deepMerge(tv, sv);
            }
            else if (sv !== undefined) {
                result[key] = sv;
            }
        }
    }
    return result;
}
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
const isArrayType = (value) => Array.isArray(value) || value == null;
const isObjectType = (value) => (typeof value === "object" && value !== null) || value == null;
const getDifference = (a, b) => {
    if (JSON.stringify(a) === JSON.stringify(b)) {
        return undefined;
    }
    else if (b == null) {
        return exports.Removed;
    }
    else if (isArrayType(a) && isArrayType(b)) {
        return Array.from({ length: Math.max(a?.length || 0, b?.length || 0) }, (_, i) => (0, exports.getDifference)(a?.[i], b?.[i]));
    }
    else if (isObjectType(a) && isObjectType(b)) {
        const diff = {};
        for (const key of [...new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])]) {
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
    return template.replace(/{([^{}]+)}/g, (_v, k) => {
        return k.split(".").reduce((obj, part) => obj?.[part], props);
    });
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