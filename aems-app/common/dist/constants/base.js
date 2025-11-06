"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const util_1 = require("../utils/util");
class Base {
    constructor(values, decorator) {
        this._matcher = (v) => v;
        this.parse = (value) => {
            let parsed = undefined;
            if (typeof value === "number") {
                parsed = this._values[value];
            }
            else if (typeof value === "object" && (0, lodash_1.has)(value, "name")) {
                parsed = this.parse(value.name);
            }
            else if (typeof value === "string") {
                parsed = this._constants[value];
                if (!parsed) {
                    const t = this._matcher(value);
                    parsed = this._values.find((v) => this._keys.map((k) => this._matcher(v[k])).includes(t));
                }
            }
            return parsed;
        };
        this.parseStrict = (value) => {
            const parsed = this.parse(value);
            if (!parsed) {
                throw new Error(`Unknown constant for ${JSON.stringify(value, undefined, 2)}.`);
            }
            return parsed;
        };
        if (!values?.length) {
            throw new Error("Values with at least one item must be specified.");
        }
        this._values = values.map((v) => (0, util_1.deepFreeze)(decorator ? decorator(this, v) : v));
        this._constants = values.reduce((p, c) => (0, lodash_1.merge)(p, (0, lodash_1.merge)({ [c.name]: c }, { [c.label]: c })), {});
        this._keys = Object.keys(values[0]).filter((k) => typeof values[0][k] === "string");
    }
    get matcher() {
        return this._matcher;
    }
    set matcher(matcher) {
        this._matcher = matcher;
    }
    get values() {
        return this._values;
    }
    get constants() {
        return this._constants;
    }
    get length() {
        return this._values.length;
    }
    *[Symbol.iterator]() {
        for (const value of this._values) {
            yield value;
        }
    }
}
exports.default = Base;
//# sourceMappingURL=base.js.map