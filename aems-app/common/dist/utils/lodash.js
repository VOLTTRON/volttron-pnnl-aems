"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isString = exports.isNumber = exports.isArray = exports.noop = exports.isEqual = exports.isEmpty = exports.isPlainObject = exports.isObject = exports.isNil = void 0;
exports.pick = pick;
exports.omit = omit;
exports.compact = compact;
exports.flatten = flatten;
exports.flattenDeep = flattenDeep;
exports.uniq = uniq;
exports.uniqBy = uniqBy;
exports.difference = difference;
exports.differenceBy = differenceBy;
exports.intersection = intersection;
exports.intersectionBy = intersectionBy;
exports.union = union;
exports.xor = xor;
exports.groupBy = groupBy;
exports.keyBy = keyBy;
exports.countBy = countBy;
exports.zipObject = zipObject;
exports.first = first;
exports.last = last;
exports.range = range;
exports.sortBy = sortBy;
exports.orderBy = orderBy;
exports.chunk = chunk;
exports.max = max;
exports.maxBy = maxBy;
exports.min = min;
exports.minBy = minBy;
exports.sum = sum;
exports.sumBy = sumBy;
exports.mean = mean;
exports.meanBy = meanBy;
exports.get = get;
exports.set = set;
exports.has = has;
exports.mapKeys = mapKeys;
exports.mapValues = mapValues;
exports.invert = invert;
exports.defaults = defaults;
exports.pickBy = pickBy;
exports.omitBy = omitBy;
exports.camelCase = camelCase;
exports.snakeCase = snakeCase;
exports.kebabCase = kebabCase;
exports.capitalize = capitalize;
exports.startCase = startCase;
exports.truncate = truncate;
exports.repeat = repeat;
exports.pad = pad;
exports.debounce = debounce;
exports.throttle = throttle;
exports.once = once;
exports.memoize = memoize;
exports.identity = identity;
exports.clamp = clamp;
exports.upperFirst = upperFirst;
exports.cloneDeep = cloneDeep;
exports.merge = merge;
exports.uniqWith = uniqWith;
function pick(obj, keys) {
    if (obj == null)
        return {};
    const set = new Set(keys);
    return Object.fromEntries(Object.entries(obj).filter(([k]) => set.has(k)));
}
function omit(obj, keys) {
    if (obj == null)
        return {};
    const set = new Set(keys);
    return Object.fromEntries(Object.entries(obj).filter(([k]) => !set.has(k)));
}
function compact(array) {
    return array.filter(Boolean);
}
function flatten(array) {
    return array.flat();
}
function flattenDeep(array) {
    return array.flat(Infinity);
}
function uniq(array) {
    return [...new Set(array)];
}
function uniqBy(array, iteratee) {
    const seen = new Set();
    return array.filter((v) => {
        const k = iteratee(v);
        if (seen.has(k))
            return false;
        seen.add(k);
        return true;
    });
}
function difference(array, ...values) {
    const excluded = new Set(values.flat());
    return array.filter((x) => !excluded.has(x));
}
function differenceBy(array, ...rest) {
    const iteratee = typeof rest[rest.length - 1] === "function"
        ? rest.pop()
        : (v) => v;
    const excluded = new Set(rest.flat().map(iteratee));
    return array.filter((v) => !excluded.has(iteratee(v)));
}
function intersection(...arrays) {
    if (arrays.length === 0)
        return [];
    const [first, ...rest] = arrays;
    return first.filter((v) => rest.every((arr) => arr.includes(v)));
}
function intersectionBy(array, ...rest) {
    const iteratee = typeof rest[rest.length - 1] === "function"
        ? rest.pop()
        : (v) => v;
    const others = rest;
    return array.filter((v) => others.every((arr) => arr.some((x) => iteratee(x) === iteratee(v))));
}
function union(...arrays) {
    return [...new Set(arrays.flat())];
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
function groupBy(array, iteratee) {
    return array.reduce((acc, v) => {
        const k = iteratee(v);
        (acc[k] ??= []).push(v);
        return acc;
    }, {});
}
function keyBy(array, iteratee) {
    return array.reduce((acc, v) => {
        acc[iteratee(v)] = v;
        return acc;
    }, {});
}
function countBy(array, iteratee) {
    return array.reduce((acc, v) => {
        const k = iteratee(v);
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
    }, {});
}
function zipObject(keys, values) {
    return Object.fromEntries(keys.map((k, i) => [k, values[i]]));
}
function first(array) {
    return array[0];
}
function last(array) {
    return array[array.length - 1];
}
function range(startOrEnd, end, step = 1) {
    const start = end === undefined ? 0 : startOrEnd;
    const stop = end === undefined ? startOrEnd : end;
    if (step === 0)
        throw new RangeError("range step must not be zero");
    const length = Math.max(Math.ceil((stop - start) / step), 0);
    return Array.from({ length }, (_, i) => start + i * step);
}
function toIterateeFn(iteratee) {
    if (typeof iteratee === "function")
        return iteratee;
    return (v) => v[iteratee];
}
function sortBy(array, ...args) {
    const flat = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
    const fns = flat.map(toIterateeFn);
    return [...array].sort((a, b) => {
        for (const fn of fns) {
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
function orderBy(array, iteratees, orders) {
    const fns = iteratees.map(toIterateeFn);
    return [...array].sort((a, b) => {
        for (let i = 0; i < fns.length; i++) {
            const fa = fns[i](a);
            const fb = fns[i](b);
            const dir = orders[i] === "desc" ? -1 : 1;
            if (fa < fb)
                return -1 * dir;
            if (fa > fb)
                return 1 * dir;
        }
        return 0;
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
function max(array) {
    return array.length ? array.reduce((a, b) => (a > b ? a : b)) : undefined;
}
function maxBy(array, iteratee) {
    if (!array.length)
        return undefined;
    return array.reduce((best, v) => (iteratee(v) > iteratee(best) ? v : best));
}
function min(array) {
    return array.length ? array.reduce((a, b) => (a < b ? a : b)) : undefined;
}
function minBy(array, iteratee) {
    if (!array.length)
        return undefined;
    return array.reduce((best, v) => (iteratee(v) < iteratee(best) ? v : best));
}
function sum(array) {
    return array.reduce((a, b) => (typeof b === "number" ? a + b : a), 0);
}
function sumBy(array, iteratee) {
    return array.reduce((acc, v) => acc + iteratee(v), 0);
}
function mean(array) {
    return array.length ? sum(array) / array.length : undefined;
}
function meanBy(array, iteratee) {
    return array.length ? sumBy(array, iteratee) / array.length : undefined;
}
function parsePath(path) {
    if (Array.isArray(path))
        return path;
    return path.replace(/\[(\d+)\]/g, ".$1").split(".").filter((k) => k !== "");
}
function get(obj, path, defaultValue) {
    const keys = parsePath(path);
    let value = obj;
    for (const key of keys) {
        if (value == null)
            return defaultValue;
        value = value[key];
    }
    return (value === undefined ? defaultValue : value);
}
function set(obj, path, value) {
    const keys = parsePath(path);
    if (keys.length === 0)
        return obj;
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (cur[k] == null || typeof cur[k] !== "object") {
            cur[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
        }
        cur = cur[k];
    }
    cur[keys[keys.length - 1]] = value;
    return obj;
}
function has(obj, path) {
    const keys = parsePath(path);
    let cur = obj;
    for (let i = 0; i < keys.length; i++) {
        if (cur == null || typeof cur !== "object")
            return false;
        if (!Object.prototype.hasOwnProperty.call(cur, keys[i]))
            return false;
        if (i < keys.length - 1)
            cur = cur[keys[i]];
    }
    return true;
}
function mapKeys(obj, iteratee) {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [iteratee(v, k), v]));
}
function mapValues(obj, iteratee) {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, iteratee(v, k)]));
}
function invert(obj) {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));
}
function defaults(obj, ...sources) {
    for (const source of sources) {
        for (const key of Object.keys(source)) {
            if (obj[key] === undefined)
                obj[key] = source[key];
        }
    }
    return obj;
}
function pickBy(obj, predicate = (v) => Boolean(v)) {
    return Object.fromEntries(Object.entries(obj).filter(([k, v]) => predicate(v, k)));
}
function omitBy(obj, predicate) {
    return Object.fromEntries(Object.entries(obj).filter(([k, v]) => !predicate(v, k)));
}
function words(str) {
    const pattern = /[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|[0-9]+/g;
    return str.match(pattern) ?? [];
}
function camelCase(str) {
    return words(str)
        .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
        .join("");
}
function snakeCase(str) {
    return words(str)
        .map((w) => w.toLowerCase())
        .join("_");
}
function kebabCase(str) {
    return words(str)
        .map((w) => w.toLowerCase())
        .join("-");
}
function capitalize(str) {
    return str.length === 0 ? "" : str[0].toUpperCase() + str.slice(1).toLowerCase();
}
function startCase(str) {
    return words(str)
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(" ");
}
function truncate(str, options = {}) {
    const { length = 30, omission = "..." } = options;
    if (str.length <= length)
        return str;
    return str.slice(0, length - omission.length) + omission;
}
function repeat(str, n) {
    return str.repeat(Math.max(0, Math.floor(n)));
}
function pad(str, length, chars = " ") {
    const totalPad = Math.max(0, length - str.length);
    const leftPad = Math.floor(totalPad / 2);
    const rightPad = totalPad - leftPad;
    const padStr = chars.repeat(Math.ceil(length / chars.length));
    return padStr.slice(0, leftPad) + str + padStr.slice(0, rightPad);
}
const isNil = (value) => value == null;
exports.isNil = isNil;
const isObject = (value) => typeof value === "object" && value !== null;
exports.isObject = isObject;
const isPlainObject = (value) => {
    if (typeof value !== "object" || value === null)
        return false;
    const proto = Object.getPrototypeOf(value);
    return proto === null || proto === Object.prototype;
};
exports.isPlainObject = isPlainObject;
const isEmpty = (value) => {
    if (value == null)
        return true;
    if (Array.isArray(value) || typeof value === "string")
        return value.length === 0;
    if (typeof value === "object")
        return Object.keys(value).length === 0;
    return false;
};
exports.isEmpty = isEmpty;
const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
exports.isEqual = isEqual;
function debounce(fn, ms) {
    let id;
    return ((...args) => {
        clearTimeout(id);
        id = setTimeout(() => fn(...args), ms);
    });
}
function throttle(fn, ms) {
    let last = -Infinity;
    return ((...args) => {
        const now = Date.now();
        if (now - last >= ms) {
            last = now;
            fn(...args);
        }
    });
}
function once(fn) {
    let called = false;
    let result;
    return ((...args) => {
        if (!called) {
            called = true;
            result = fn(...args);
        }
        return result;
    });
}
function memoize(fn, resolver) {
    const cache = new Map();
    return ((...args) => {
        const key = resolver ? resolver(...args) : args[0];
        if (cache.has(key))
            return cache.get(key);
        const result = fn(...args);
        cache.set(key, result);
        return result;
    });
}
const noop = (..._args) => { };
exports.noop = noop;
function identity(value) {
    return value;
}
function clamp(value, lower, upper) {
    return Math.min(Math.max(value, lower), upper);
}
const isArray = (value) => Array.isArray(value);
exports.isArray = isArray;
const isNumber = (value) => typeof value === "number";
exports.isNumber = isNumber;
const isString = (value) => typeof value === "string";
exports.isString = isString;
function upperFirst(str) {
    return str.length === 0 ? "" : str[0].toUpperCase() + str.slice(1);
}
function cloneDeep(value) {
    if (value === null || value === undefined)
        return value;
    if (typeof value !== "object")
        return value;
    if (Array.isArray(value)) {
        return value.map((v) => cloneDeep(v));
    }
    const out = {};
    for (const key of Object.keys(value)) {
        out[key] = cloneDeep(value[key]);
    }
    return out;
}
function merge(target, ...sources) {
    const result = (cloneDeep(target ?? {}) ?? {});
    for (const source of sources) {
        if (!source)
            continue;
        for (const key of Object.keys(source)) {
            const sv = source[key];
            const tv = result[key];
            if (sv &&
                typeof sv === "object" &&
                !Array.isArray(sv) &&
                tv &&
                typeof tv === "object" &&
                !Array.isArray(tv)) {
                result[key] = merge(tv, sv);
            }
            else if (sv !== undefined) {
                result[key] = cloneDeep(sv);
            }
        }
    }
    return result;
}
function uniqWith(array, comparator) {
    const result = [];
    for (const value of array) {
        if (!result.some((seen) => comparator(seen, value))) {
            result.push(value);
        }
    }
    return result;
}
//# sourceMappingURL=lodash.js.map