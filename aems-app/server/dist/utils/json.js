"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingJsonReader = void 0;
exports.tokenFactory = tokenFactory;
exports.tokenize = tokenize;
const node_fs_1 = require("node:fs");
const node_util_1 = require("node:util");
const common_1 = require("@local/common");
const rxjs_1 = require("rxjs");
function tokenFactory(token) {
    if (token === ".")
        return { type: "object", value: "." };
    if (token === "[]")
        return { type: "array", value: "[]", index: 0 };
    if (token === "$")
        return { type: "root", value: "$" };
    if (token === "*")
        return { type: "wildcard", value: "*" };
    if (/^\d+$/.test(token))
        return { type: "index", value: parseInt(token, 10) };
    if (/^\d*:\d*$/.test(token)) {
        const [start, end] = token.split(/:/).map((v) => (v ? parseInt(v, 10) : Infinity));
        return { type: "range", value: [start, end] };
    }
    if (/^\d+(,\d+)*$/.test(token)) {
        const values = token.split(",").map(Number);
        return { type: "set", value: values };
    }
    return { type: "field", value: token };
}
function tokenize(path) {
    return path
        .replace(/\s/g, "")
        .split(/\./)
        .reduce((p, c, i) => {
        const [_, v, a, s] = /^(\$|[a-z0-9_-]+)(\[)?([^\]]+)?(\])?$/i.exec(c) || [];
        const e = a ? [v, "[]", s ?? ":"] : [v];
        return i > 0 ? [...p, ".", ...e] : [...p, ...e];
    }, [])
        .filter((v) => v)
        .map(tokenFactory);
}
class StreamingJsonReader {
    constructor(path) {
        this.path = path;
        this.watcher = null;
        this.stream = null;
        this.error = null;
        this.initialize();
    }
    checkError() {
        const error = this.error;
        if (error) {
            this.close();
            throw error;
        }
        else if (!this.watcher) {
            throw new Error(`StreamingJsonReader for ${(0, common_1.colorize)(this.path, { color: "cyan" })} has not been initialized.`);
        }
    }
    initialize() {
        this.close();
        const stats = (0, node_fs_1.statSync)(this.path);
        if (!stats.isFile()) {
            this.error = new Error(`Path "${(0, common_1.colorize)(this.path, { color: "cyan" })}" is not a file.`);
            return;
        }
        if (stats.size === 0) {
            this.error = new Error(`File "${(0, common_1.colorize)(this.path, { color: "cyan" })}" is empty.`);
            return;
        }
        this.watcher = (0, node_fs_1.watch)(this.path, { persistent: true }, (_t, _f) => (this.error = new Error(`File ${(0, common_1.colorize)(this.path, { color: "cyan" })} changed during query!`)));
    }
    async *read(path, typer) {
        this.initialize();
        this.checkError();
        this.stream = (0, node_fs_1.createReadStream)(this.path, { encoding: "utf-8", flags: "r" });
        const query = tokenize(path);
        if (query[0]?.type !== "root") {
            throw new Error("Non-root queries are not yet supported.");
        }
        if (query.find((v) => v.type === "wildcard")) {
            throw new Error("Wildcard queries are not supported.");
        }
        const parser = new JsonStreamParser();
        try {
            for await (const chunk of this.stream) {
                this.checkError();
                const matches = parser.parse(chunk, query);
                for (const match of matches) {
                    const typed = typer ? typer?.(match) : true;
                    yield typed ? match : (0, rxjs_1.throwError)(`Received match of invalid type: ${typeof match}`);
                }
            }
            this.checkError();
            const matches = parser.parse(null, query);
            for (const match of matches) {
                yield match;
            }
        }
        finally {
            this.close();
        }
    }
    close() {
        this.watcher?.close();
        this.watcher = null;
        this.stream?.destroy();
        this.stream = null;
        this.error = null;
    }
}
exports.StreamingJsonReader = StreamingJsonReader;
class JsonPathStack {
    constructor() {
        this._stack = [];
        this._modified = false;
        this._stack = [{ type: "root", value: "$" }];
    }
    modified() {
        const modified = this._modified;
        this._modified = false;
        return modified;
    }
    length() {
        return this._stack.length;
    }
    peek() {
        return this._stack[0];
    }
    top() {
        return this._stack[this._stack.length - 1];
    }
    clear() {
        this._stack = [{ type: "eof", value: "" }];
        this._modified = true;
    }
    push(token) {
        this._stack.push(token);
        this._modified = true;
    }
    pop() {
        if (this._stack.length === 1) {
            throw new Error("Cannot pop from stack, only root token remains.");
        }
        this._modified = true;
        return this._stack.pop();
    }
    at(index) {
        return this._stack[index];
    }
    [Symbol.iterator]() {
        return this._stack[Symbol.iterator]();
    }
}
class JsonStreamParser {
    constructor() {
        this.value = "";
        this.type = "unknown";
        this.target = "";
        this.cursor = 0;
        this.debug = (0, common_1.parseBoolean)(process.env.DEBUG_JSON ?? "");
        this.cache = "";
        this.stack = new JsonPathStack();
    }
    parse(chunk, query) {
        if (this.stack.peek().type === "eof") {
            throw new Error("Cannot parse JSON, parser is already at EOF.");
        }
        const matches = [];
        for (const char of chunk ?? [""]) {
            this.cache = (this.cache + char).slice(-128);
            const debug = [...this.stack];
            const type = this.type;
            const matched = this.matchesPath(query, false);
            const { prepend, delineate } = this.handleCharacter(query, char);
            if (char === "") {
                this.type = "unknown";
                this.stack.clear();
            }
            const matching = this.matchesPath(query, delineate ?? false);
            if (this.debug) {
                if (char === "") {
                    console.log("End of stream reached, resetting parser state.");
                }
                if (this.stack.modified()) {
                    console.log((0, node_util_1.inspect)({
                        char: char,
                        target: prepend ? this.target + char : this.target,
                        query: query,
                        matched: { equal: matched, type: type, stack: debug },
                        matching: { equal: matching, type: this.type, stack: this.stack },
                    }, undefined, 10, true));
                }
            }
            if (matched) {
                if (prepend) {
                    this.target += char;
                }
                if (!matching) {
                    try {
                        if (this.target) {
                            const match = JSON.parse(this.target);
                            matches.push(match);
                            if (this.debug) {
                                console.log(`Match found at ${this.cursor}: ${(0, common_1.colorize)(this.target, { color: "green" })}`);
                            }
                        }
                    }
                    catch (error) {
                        const reason = (0, common_1.typeofObject)(error, (v) => "message" in v)
                            ? error.message
                            : typeof error === "string"
                                ? error
                                : "Unknown error";
                        console.log((0, node_util_1.inspect)({ ...this, query }, undefined, 10, true));
                        throw new Error(`Unable to parse JSON match at ${this.cursor}: ${this.cache.replace(this.target, "")}${(0, common_1.colorize)(this.target, { color: "blue" })} (${(0, common_1.colorize)(reason, { color: "red" })})`);
                    }
                    this.target = "";
                }
                else if (!prepend) {
                    this.target += char;
                }
            }
            this.cursor++;
        }
        return matches;
    }
    handleCharacter(query, char) {
        let top = this.stack.top();
        switch (this.type) {
            case "unknown":
                if (char === "{") {
                    this.type = "object";
                    this.stack.push({ type: "object", value: "." });
                }
                else if (char === "[") {
                    this.type = "unknown";
                    this.stack.push({ type: "array", value: "[]", index: 0 });
                    this.stack.push({ type: "index", value: 0 });
                }
                else if (char === '"') {
                    this.type = "string";
                    this.value = '"';
                }
                else if (/^[0-9-]$/.test(char)) {
                    this.type = "number";
                    this.value = char;
                }
                else if (char === "t" || char === "f") {
                    this.type = "boolean";
                    this.value = char;
                }
                else if (char === "n") {
                    this.type = "null";
                    this.value = char;
                }
                else if (char === "}") {
                    this.type = "unknown";
                    while (this.stack.top().type !== "object") {
                        this.stack.pop();
                    }
                    this.stack.pop();
                }
                else if (char === "]") {
                    this.type = "unknown";
                    while (this.stack.top().type !== "array") {
                        this.stack.pop();
                    }
                    this.stack.pop();
                }
                else if (char === "," && top.type === "index") {
                    this.type = "unknown";
                    this.stack.pop();
                    top = this.stack.top();
                    if (top.type === "array") {
                        top.index++;
                        this.stack.push({ type: "index", value: top.index });
                    }
                    return { delineate: true };
                }
                else if (char === ",") {
                    if (this.stack.top().type === "field") {
                        this.stack.pop();
                    }
                    this.type = "object";
                }
                else if (char.trim() === "") {
                }
                else {
                    throw new Error(`Unexpected character "${char}" in JSON path at '${(0, common_1.colorize)(this.cache, { color: "blue" })}'[${this.cursor}].`);
                }
                break;
            case "object":
                if (char === '"') {
                    this.type = "field";
                    this.value = "";
                }
                else if (char.trim() === "") {
                }
                else if (char === "}") {
                    this.type = "unknown";
                    while (this.stack.top().type !== "object") {
                        this.stack.pop();
                    }
                    this.stack.pop();
                }
                else {
                    console.log((0, node_util_1.inspect)(this.stack, undefined, 10, true));
                    throw new Error(`Unexpected character "${char}" in JSON object at '${(0, common_1.colorize)(this.cache, { color: "blue" })}'[${this.cursor}].`);
                }
                break;
            case "field":
                if (char === '"' && !this.value.endsWith("\\")) {
                    this.type = "closed";
                }
                else {
                    this.value += char;
                }
                break;
            case "closed":
                if (char === ":") {
                    this.type = "unknown";
                    this.stack.push({ type: "field", value: this.value });
                }
                else {
                    throw new Error(`Unexpected character "${char}" after closed JSON field at '${(0, common_1.colorize)(this.cache, { color: "blue" })}'[${this.cursor}].`);
                }
                break;
            case "string":
                if (char === '"' && !this.value.endsWith("\\")) {
                    this.type = "unknown";
                    if (this.stack.top().type === "field") {
                        this.stack.pop();
                    }
                    return { prepend: true };
                }
                else {
                    this.value += char;
                }
                break;
            case "number":
                if (!/^[0-9ex.+-]$/.test(char)) {
                    this.type = "unknown";
                    if (this.stack.top().type === "field") {
                        this.stack.pop();
                    }
                    return this.handleCharacter(query, char);
                }
                else {
                    this.value += char;
                }
                break;
            case "boolean":
                if (/^(true|false)$/.test(this.value)) {
                    this.type = "unknown";
                    if (this.stack.top().type === "field") {
                        this.stack.pop();
                    }
                    return this.handleCharacter(query, char);
                }
                else {
                    this.value += char;
                }
                break;
            case "null":
                if (/^null$/.test(this.value)) {
                    this.type = "unknown";
                    if (this.stack.top().type === "field") {
                        this.stack.pop();
                    }
                    return this.handleCharacter(query, char);
                }
                else {
                    this.value += char;
                }
                break;
            default:
                return {};
        }
        return {};
    }
    matchesToken(target, query, delineate) {
        if (!target || !query)
            return false;
        switch (query.type) {
            case "root":
                return target.type === "root";
            case "object":
                return target.type === "object";
            case "array":
                return target.type === "array";
            case "field":
                return target.type === "field" && target.value === query.value;
            case "index":
                return !delineate && target.type === "index" && target.value === query.value;
            case "set":
                return !delineate && target.type === "index" && query.value.includes(target.value);
            case "range":
                return (!delineate &&
                    target.type === "index" &&
                    (query.value[0] === Infinity || target.value >= query.value[0]) &&
                    (query.value[1] === Infinity || target.value < query.value[1]));
            case "wildcard":
                return ["field", "index", "object", "array"].includes(target.type);
            default:
                return false;
        }
    }
    matchesPath(query, delineate) {
        delineate = this.stack.length() <= query.length && delineate;
        if (this.stack.at(0)?.type === "eof") {
            return false;
        }
        else if (query[0]?.type === "root" && this.stack.at(0)?.type === "root") {
            for (let i = 1; i < query.length; i++) {
                const queryToken = query[i];
                const targetToken = this.stack.at(i);
                if (!this.matchesToken(targetToken, queryToken, delineate)) {
                    return false;
                }
            }
            return true;
        }
        else {
            for (let i = 0; i < this.stack.length(); i++) {
                for (let j = 0; j < query.length - i; j++) {
                    const queryToken = query[j];
                    const targetToken = this.stack.at(i + j);
                    if (this.matchesToken(targetToken, queryToken, delineate)) {
                        if (j === query.length - 1) {
                            return true;
                        }
                        continue;
                    }
                }
            }
            return false;
        }
    }
}
//# sourceMappingURL=json.js.map