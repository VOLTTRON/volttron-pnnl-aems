"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectRenderErrors = exports.transformTemplate = exports.isRenderError = exports.makeRenderError = void 0;
const lodash_1 = require("@local/common/dist/utils/lodash");
const common_1 = require("@local/common");
const makeRenderError = (message, phase) => ({
    _error: message,
    phase,
});
exports.makeRenderError = makeRenderError;
const isRenderError = (v) => typeof v === "object" && v !== null && "_error" in v && typeof v._error === "string";
exports.isRenderError = isRenderError;
const errorMessage = (err) => (err instanceof Error ? err.message : String(err));
const applyFunction = (unit, action) => {
    return Function.apply(null, [
        ...action.sources.map((s) => s.split(".").pop()),
        `return ${action.expression};`,
    ])(...action.sources.map((s) => (0, lodash_1.get)(unit, s)));
};
const transformTemplate = (template, params) => {
    const transformer = (object, path, key, value) => {
        if (typeof key === "string") {
            try {
                key = (0, common_1.templateFormat)(key, params);
            }
            catch (err) {
                const errMarker = (0, exports.makeRenderError)(errorMessage(err), "key");
                const finalPath = path.length === 0 ? "_errorKey" : `${path}._errorKey`;
                (0, lodash_1.set)(object, finalPath, errMarker);
                return object;
            }
        }
        let setter = (v) => (0, lodash_1.set)(object, path, v);
        if (key === undefined) {
            path = "";
            setter = (v) => (object = v);
        }
        else {
            path = path.length === 0 ? `${key}` : `${path}.${key}`;
            setter = (v) => (0, lodash_1.set)(object, path, v);
        }
        if ((0, exports.isRenderError)(value)) {
            setter(value);
            return object;
        }
        do {
            const type = (0, lodash_1.get)(value, "_type");
            if (type === undefined)
                break;
            try {
                switch (type) {
                    case "value":
                        value = applyFunction(params, value);
                        break;
                    case "evaluate": {
                        const lookupKey = applyFunction(params, value);
                        const lookup = (0, lodash_1.get)(value, `values.${lookupKey}`, undefined);
                        if (lookup === undefined || lookup === null) {
                            value = (0, exports.makeRenderError)(`evaluate expression "${value.expression}" produced key "${String(lookupKey)}" which is not present in values`, "evaluate");
                        }
                        else {
                            value = lookup;
                        }
                        break;
                    }
                    case "remove":
                        return;
                    case "map":
                        value = (0, lodash_1.get)(params, value.path, []).map((v) => (0, exports.transformTemplate)(value.value, v));
                        break;
                    case "reduce":
                        value = (0, lodash_1.get)(params, value.path, []).reduce((a, v) => (0, lodash_1.merge)(a, (0, exports.transformTemplate)(value.value, v)), {});
                        break;
                    default:
                }
            }
            catch (err) {
                value = (0, exports.makeRenderError)(errorMessage(err), type);
            }
            if ((0, exports.isRenderError)(value))
                break;
        } while ((0, lodash_1.get)(value, "_type"));
        if ((0, exports.isRenderError)(value)) {
            setter(value);
            return object;
        }
        if (typeof value === "string") {
            try {
                setter((0, common_1.templateFormat)(value, params));
            }
            catch (err) {
                setter((0, exports.makeRenderError)(errorMessage(err), "string"));
            }
        }
        else if (Array.isArray(value)) {
            setter([]);
            value.forEach((v, i) => transformer(object, path, `[${i}]`, v));
        }
        else if (typeof value === "object" && value !== null) {
            setter({});
            try {
                Object.entries(value).forEach(([k, v]) => transformer(object, path, k, v));
            }
            catch (err) {
                setter((0, exports.makeRenderError)(errorMessage(err), "iterate"));
            }
        }
        else {
            setter(value);
        }
        return object;
    };
    return transformer({}, "", undefined, (0, lodash_1.cloneDeep)(template));
};
exports.transformTemplate = transformTemplate;
const collectRenderErrors = (value) => {
    const errors = [];
    const walk = (v) => {
        if ((0, exports.isRenderError)(v)) {
            errors.push(v);
            return;
        }
        if (Array.isArray(v)) {
            v.forEach(walk);
            return;
        }
        if (typeof v === "object" && v !== null) {
            Object.values(v).forEach(walk);
        }
    };
    walk(value);
    return errors;
};
exports.collectRenderErrors = collectRenderErrors;
//# sourceMappingURL=template.js.map