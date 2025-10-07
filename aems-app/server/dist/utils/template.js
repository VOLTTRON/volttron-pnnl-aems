"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformTemplate = void 0;
const lodash_1 = require("lodash");
const common_1 = require("@local/common");
const applyFunction = (unit, action) => {
    return Function.apply(null, [
        ...action.sources.map((s) => s.split(".").pop()),
        `return ${action.expression};`,
    ])(...action.sources.map((s) => (0, lodash_1.get)(unit, s)));
};
const transformTemplate = (template, params) => {
    const transformer = (object, path, key, value) => {
        if (typeof key === "string") {
            key = (0, common_1.templateFormat)(key, params);
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
        do {
            switch ((0, lodash_1.get)(value, "_type")) {
                case "value":
                    value = applyFunction(params, value);
                    break;
                case "evaluate":
                    value = (0, lodash_1.get)(value, `values.${applyFunction(params, value)}`, null);
                    break;
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
        } while ((0, lodash_1.get)(value, "_type"));
        if (typeof value === "string") {
            setter((0, common_1.templateFormat)(value, params));
        }
        else if (Array.isArray(value)) {
            setter([]);
            value.forEach((v, i) => transformer(object, path, `[${i}]`, v));
        }
        else if (typeof value === "object") {
            setter({});
            Object.entries(value).forEach(([k, v]) => transformer(object, path, k, v));
        }
        else {
            setter(value);
        }
        return object;
    };
    return transformer({}, "", undefined, (0, lodash_1.cloneDeep)(template));
};
exports.transformTemplate = transformTemplate;
//# sourceMappingURL=template.js.map