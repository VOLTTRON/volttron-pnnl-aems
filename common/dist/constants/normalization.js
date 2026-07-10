"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const regex_1 = require("regex");
const base_1 = require("./base");
const util_1 = require("../utils/util");
const processLettersAndNumbers = (v) => v.replace((0, regex_1.regex)("gm") `[^\s\p{L}0-9]`, "");
class Normalization extends base_1.default {
    constructor() {
        super([
            {
                name: "NFD",
                label: "NFD",
                unallowed: ["NFC", "NFKD", "NFKC"],
                process: ((v) => (v == null ? "" : v.normalize("NFD"))),
            },
            {
                name: "NFC",
                label: "NFC",
                unallowed: ["NFD", "NFKD", "NFKC"],
                process: ((v) => (v == null ? "" : v.normalize("NFC"))),
            },
            {
                name: "NFKD",
                label: "NFKD",
                unallowed: ["NFD", "NFC", "NFKC"],
                process: ((v) => (v == null ? "" : v.normalize("NFKD"))),
            },
            {
                name: "NFKC",
                label: "NFKC",
                unallowed: ["NFD", "NFC", "NFKD"],
                process: ((v) => (v == null ? "" : v.normalize("NFKC"))),
            },
            {
                name: "LOWERCASE",
                label: "Lowercase",
                unallowed: ["UPPERCASE"],
                process: ((v) => (v == null ? "" : v.toLowerCase())),
            },
            {
                name: "UPPERCASE",
                label: "Uppercase",
                unallowed: ["LOWERCASE"],
                process: ((v) => (v == null ? "" : v.toUpperCase())),
            },
            {
                name: "LETTERS",
                label: "Letters",
                unallowed: [],
                process: ((v) => (v == null ? "" : v.replace((0, regex_1.regex)("gm") `[^\s\p{L}]`, ""))),
            },
            {
                name: "NUMBERS",
                label: "Numbers",
                unallowed: [],
                process: ((v) => (v == null ? "" : v.replace(/[^\s0-9]/gm, ""))),
            },
            {
                name: "TRIM",
                label: "Trim",
                unallowed: ["CONCATENATE"],
                process: ((v) => (v == null ? "" : v.trim())),
            },
            {
                name: "COMPACT",
                label: "Compact",
                unallowed: ["CONCATENATE"],
                process: ((v) => (v == null ? "" : v.replace(/\s+/gm, " "))),
            },
            {
                name: "CONCATENATE",
                label: "Concatenate",
                unallowed: ["TRIM", "COMPACT"],
                process: ((v) => (v == null ? "" : v.replace(/\s+/gm, ""))),
            },
        ].map((r) => ({
            ...r,
            allowed: ((_v) => {
                throw new Error("Normalization allowed function not implemented.");
            }),
        })), (t, r) => (0, util_1.deepMerge)(r, {
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
            return normalizations.filter(v => allowed.includes(v)).length === 0;
        };
        this.process = (...types) => {
            const joined = types.map((t) => (t !== null && typeof t === "object" && Object.prototype.hasOwnProperty.call(t, "label") ? (t).label : t)).join("|");
            const parsed = joined.split(/[^a-zA-Z']+/).map((s) => this.parse(s));
            const normalize = this.values.filter((a) => parsed.some((b) => a?.name === b?.name));
            return (value) => {
                return normalize.reduce((p, n, i, a) => {
                    if ((n.name === "LETTERS" && a[i + 1]?.name === "NUMBERS") ||
                        (n.name === "NUMBERS" && a[i - 1]?.name === "LETTERS")) {
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