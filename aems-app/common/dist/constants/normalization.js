"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const regex_1 = require("regex");
const base_1 = require("./base");
const processLettersAndNumbers = (v) => (0, lodash_1.isNil)(v) ? "" : (0, lodash_1.replace)(v, (0, regex_1.regex)("gm") `[^\s\p{L}0-9]`, "");
class Normalization extends base_1.default {
    constructor() {
        super([
            {
                name: "NFD",
                label: "NFD",
                unallowed: ["NFC", "NFKD", "NFKC"],
                process: ((v) => ((0, lodash_1.isNil)(v) ? "" : v.normalize("NFD"))),
            },
            {
                name: "NFC",
                label: "NFC",
                unallowed: ["NFD", "NFKD", "NFKC"],
                process: ((v) => ((0, lodash_1.isNil)(v) ? "" : v.normalize("NFC"))),
            },
            {
                name: "NFKD",
                label: "NFKD",
                unallowed: ["NFD", "NFC", "NFKC"],
                process: ((v) => ((0, lodash_1.isNil)(v) ? "" : v.normalize("NFKD"))),
            },
            {
                name: "NFKC",
                label: "NFKC",
                unallowed: ["NFD", "NFC", "NFKD"],
                process: ((v) => ((0, lodash_1.isNil)(v) ? "" : v.normalize("NFKC"))),
            },
            {
                name: "LOWERCASE",
                label: "Lowercase",
                unallowed: ["UPPERCASE"],
                process: ((v) => ((0, lodash_1.isNil)(v) ? "" : v.toLowerCase())),
            },
            {
                name: "UPPERCASE",
                label: "Uppercase",
                unallowed: ["LOWERCASE"],
                process: ((v) => ((0, lodash_1.isNil)(v) ? "" : v.toUpperCase())),
            },
            {
                name: "LETTERS",
                label: "Letters",
                unallowed: [],
                process: ((v) => ((0, lodash_1.isNil)(v) ? "" : (0, lodash_1.replace)(v, (0, regex_1.regex)("gm") `[^\s\p{L}]`, ""))),
            },
            {
                name: "NUMBERS",
                label: "Numbers",
                unallowed: [],
                process: ((v) => ((0, lodash_1.isNil)(v) ? "" : (0, lodash_1.replace)(v, /[^\s0-9]/gm, ""))),
            },
            {
                name: "TRIM",
                label: "Trim",
                unallowed: ["CONCATENATE"],
                process: ((v) => ((0, lodash_1.isNil)(v) ? "" : v.trim())),
            },
            {
                name: "COMPACT",
                label: "Compact",
                unallowed: ["CONCATENATE"],
                process: ((v) => ((0, lodash_1.isNil)(v) ? "" : (0, lodash_1.replace)(v, /\s+/gm, " "))),
            },
            {
                name: "CONCATENATE",
                label: "Concatenate",
                unallowed: ["TRIM", "COMPACT"],
                process: ((v) => ((0, lodash_1.isNil)(v) ? "" : (0, lodash_1.replace)(v, /\s+/gm, ""))),
            },
        ].map((r) => ({
            ...r,
            allowed: ((_v) => {
                throw new Error("Normalization allowed function not implemented.");
            }),
        })), (t, r) => (0, lodash_1.merge)(r, {
            allowed: (r.unallowed.length === 0
                ? (_v) => true
                : (...v) => t.allowed(r, ...v)),
        }));
        this.NFD = this.parseStrict("NFD");
        this.NFDType = this.parseStrict("NFD");
        this.NFC = this.parseStrict("NFC");
        this.NFCType = this.parseStrict("NFC");
        this.NFKD = this.parseStrict("NFKD");
        this.NFKDType = this.parseStrict("NFKD");
        this.NFKC = this.parseStrict("NFKC");
        this.NFKCType = this.parseStrict("NFKC");
        this.Lowercase = this.parseStrict("Lowercase");
        this.LowercaseType = this.parseStrict("Lowercase");
        this.Uppercase = this.parseStrict("Uppercase");
        this.UppercaseType = this.parseStrict("Uppercase");
        this.Letters = this.parseStrict("Letters");
        this.LettersType = this.parseStrict("Letters");
        this.Numbers = this.parseStrict("Numbers");
        this.NumbersType = this.parseStrict("Numbers");
        this.Trim = this.parseStrict("Trim");
        this.TrimType = this.parseStrict("Trim");
        this.Compact = this.parseStrict("Compact");
        this.CompactType = this.parseStrict("Compact");
        this.Concatenate = this.parseStrict("Concatenate");
        this.ConcatenateType = this.parseStrict("Concatenate");
        this.allowed = (a, ...b) => {
            const normalizations = b.map((v) => this.parse(v)?.name).filter((v) => v);
            const allowed = this.parse(a)?.unallowed ?? [];
            return (0, lodash_1.isEmpty)((0, lodash_1.intersection)(normalizations, allowed));
        };
        this.process = (...types) => {
            const joined = types.map((t) => ((0, lodash_1.has)(t, "label") ? t.label : t)).join("|");
            const normalize = (0, lodash_1.intersectionWith)(this.values, joined.split(/[^a-zA-Z']+/).map((s) => this.parse(s)), (a, b) => a?.name === b?.name);
            return (value) => {
                return normalize.reduce((p, n, i, a) => {
                    if ((n.name === "LETTERS" && (0, lodash_1.get)(a, [i + 1, "name"]) === "NUMBERS") ||
                        (n.name === "NUMBERS" && (0, lodash_1.get)(a, [i - 1, "name"]) === "LETTERS")) {
                        return processLettersAndNumbers(p);
                    }
                    return n.process(p);
                }, value);
            };
        };
    }
}
const normalization = new Normalization();
exports.default = normalization;
//# sourceMappingURL=normalization.js.map