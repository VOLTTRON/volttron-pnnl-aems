import { createReadStream, FSWatcher, ReadStream, statSync, watch } from "node:fs";
import { inspect } from "node:util";
import { colorize, parseBoolean, typeofObject } from "@local/common";
import { throwError } from "rxjs";

export interface EofToken {
  type: "eof";
  value: "";
}

export interface RootToken {
  type: "root";
  value: "$";
}

export interface ObjectToken {
  type: "object";
  value: ".";
}

export interface ArrayToken {
  type: "array";
  value: "[]";
  index: number;
}

export interface FieldToken {
  type: "field";
  value: string;
}

export interface IndexToken {
  type: "index";
  value: number;
}

export interface WildcardToken {
  type: "wildcard";
  value: "*";
}

export interface SetToken {
  type: "set";
  value: number[];
}

export interface RangeToken {
  type: "range";
  value: [number, number];
}

export type JsonPathToken =
  | EofToken
  | RootToken
  | ObjectToken
  | ArrayToken
  | FieldToken
  | IndexToken
  | WildcardToken
  | SetToken
  | RangeToken;

export function tokenFactory(token: string) {
  if (token === ".") return { type: "object", value: "." } as ObjectToken;
  if (token === "[]") return { type: "array", value: "[]", index: 0 } as ArrayToken;
  if (token === "$") return { type: "root", value: "$" } as RootToken;
  if (token === "*") return { type: "wildcard", value: "*" } as WildcardToken;
  if (/^\d+$/.test(token)) return { type: "index", value: parseInt(token, 10) } as IndexToken;
  if (/^\d*:\d*$/.test(token)) {
    const [start, end] = token.split(/:/).map((v) => (v ? parseInt(v, 10) : Infinity));
    return { type: "range", value: [start, end] } as RangeToken;
  }
  if (/^\d+(,\d+)*$/.test(token)) {
    const values = token.split(",").map(Number);
    return { type: "set", value: values } as SetToken;
  }
  return { type: "field", value: token } as FieldToken;
}

export function tokenize(path: string): JsonPathToken[] {
  return path
    .replace(/\s/g, "")
    .split(/\./)
    .reduce((p, c, i) => {
      const [_, v, a, s] = /^(\$|[a-z0-9_-]+)(\[)?([^\]]+)?(\])?$/i.exec(c) || [];
      const e = a ? [v, "[]", s ?? ":"] : [v];
      return i > 0 ? [...p, ".", ...e] : [...p, ...e];
    }, [] as string[])
    .filter((v) => v)
    .map(tokenFactory);
}

/**
 * A class for reading JSON files as streams.
 * This class is optimized for reduced memory usage when processing large JSON files where only a small portion of the data is needed at any given time.
 * It is especially useful when reading a list of items where each item is then loaded into some other data structure.
 */
export class StreamingJsonReader {
  private watcher: FSWatcher | null = null;
  private stream: ReadStream | null = null;
  private error: Error | null = null;

  constructor(private path: string) {
    this.initialize();
  }

  private checkError() {
    const error = this.error;
    if (error) {
      this.close();
      throw error;
    } else if (!this.watcher) {
      throw new Error(`StreamingJsonReader for ${colorize(this.path, { color: "cyan" })} has not been initialized.`);
    }
  }

  private initialize() {
    this.close();
    const stats = statSync(this.path);
    if (!stats.isFile()) {
      this.error = new Error(`Path "${colorize(this.path, { color: "cyan" })}" is not a file.`);
      return;
    }
    if (stats.size === 0) {
      this.error = new Error(`File "${colorize(this.path, { color: "cyan" })}" is empty.`);
      return;
    }
    this.watcher = watch(
      this.path,
      { persistent: true },
      (_t, _f) => (this.error = new Error(`File ${colorize(this.path, { color: "cyan" })} changed during query!`)),
    );
  }

  /**
   * Reads a JSON file and yields matching nodes for a given JSONPath.
   * The JSON file will be streamed from file each time this method is called.
   * This allows for incremental reading of large JSON files without loading the entire file into memory.
   * The returned values are not checked for type safety unless a type guard is provided.
   *
   * @param path The JSONPath to query.
   * @param typer Type guard for the expected type of the returned values.
   */
  async *read<T = any>(path: string, typer?: (v: any) => v is T): AsyncGenerator<T> {
    this.initialize();
    this.checkError();
    // Create a stream to read the file
    this.stream = createReadStream(this.path, { encoding: "utf-8", flags: "r" });
    const query = tokenize(path);
    if (query[0]?.type !== "root") {
      throw new Error("Non-root queries are not yet supported.");
    }
    if (query.find((v) => v.type === "wildcard")) {
      throw new Error("Wildcard queries are not supported.");
    }
    const parser = new JsonStreamParser();
    try {
      // Read from stream and parse incrementally
      for await (const chunk of this.stream) {
        this.checkError();
        // Parse available JSON from buffer
        const matches = parser.parse(chunk as string, query);
        // Yield matching nodes
        for (const match of matches) {
          const typed = typer ? typer?.(match) : true;
          yield typed ? match : throwError(`Received match of invalid type: ${typeof match}`);
        }
      }
      // end of file
      this.checkError();
      const matches = parser.parse(null, query);
      // Yield any remaining matches
      for (const match of matches) {
        yield match;
      }
    } finally {
      this.close();
    }
  }

  private close() {
    this.watcher?.close();
    this.watcher = null;
    this.stream?.destroy();
    this.stream = null;
    this.error = null;
  }
}

class JsonPathStack implements Iterable<JsonPathToken> {
  private _stack: JsonPathToken[] = [];
  private _modified: boolean = false;

  constructor() {
    this._stack = [{ type: "root", value: "$" }];
  }

  modified(): boolean {
    const modified = this._modified;
    this._modified = false; // Reset modified state after checking
    return modified;
  }

  length(): number {
    return this._stack.length;
  }

  peek(): JsonPathToken {
    return this._stack[0];
  }

  top(): JsonPathToken {
    return this._stack[this._stack.length - 1];
  }

  clear() {
    this._stack = [{ type: "eof", value: "" }];
    this._modified = true;
  }

  push(token: JsonPathToken) {
    this._stack.push(token);
    this._modified = true;
  }

  pop(): JsonPathToken {
    if (this._stack.length === 1) {
      throw new Error("Cannot pop from stack, only root token remains.");
    }
    this._modified = true;
    return this._stack.pop() as JsonPathToken;
  }

  at(index: number): JsonPathToken | undefined {
    return this._stack[index];
  }

  [Symbol.iterator](): Iterator<JsonPathToken> {
    return this._stack[Symbol.iterator]();
  }
}

class JsonStreamParser {
  private value = "";
  private type: "unknown" | "object" | "field" | "closed" | "string" | "number" | "boolean" | "null" = "unknown";
  private stack: JsonPathStack;
  private target: string = "";
  private cursor: number = 0;
  private debug: boolean = parseBoolean(process.env.DEBUG_JSON ?? "");
  private cache: string = "";

  constructor() {
    this.stack = new JsonPathStack();
  }

  parse(chunk: string | null, query: JsonPathToken[]): any[] {
    if (this.stack.peek().type === "eof") {
      throw new Error("Cannot parse JSON, parser is already at EOF.");
    }
    const matches: any[] = [];

    for (const char of chunk ?? [""]) {
      this.cache = (this.cache + char).slice(-128);
      // preserve current state
      const debug = [...this.stack];
      const type = this.type;
      // check if current path matches the query
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
          console.log(
            inspect(
              {
                char: char,
                target: prepend ? this.target + char : this.target,
                query: query,
                matched: { equal: matched, type: type, stack: debug },
                matching: { equal: matching, type: this.type, stack: this.stack },
              },
              undefined,
              10,
              true,
            ),
          );
        }
      }

      if (matched) {
        if (prepend) {
          this.target += char;
        }
        if (!matching) {
          try {
            if (this.target) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const match = JSON.parse(this.target);
              matches.push(match);
              if (this.debug) {
                console.log(`Match found at ${this.cursor}: ${colorize(this.target, { color: "green" })}`);
              }
            }
          } catch (error: any) {
            const reason = typeofObject<Error>(error, (v) => "message" in v)
              ? error.message
              : typeof error === "string"
                ? error
                : "Unknown error";
            console.log(inspect({ ...this, query }, undefined, 10, true));
            throw new Error(
              `Unable to parse JSON match at ${this.cursor}: ${this.cache.replace(this.target, "")}${colorize(this.target, { color: "blue" })} (${colorize(reason, { color: "red" })})`,
            );
          }
          this.target = "";
        } else if (!prepend) {
          this.target += char;
        }
      }

      this.cursor++;
    }

    return matches;
  }

  handleCharacter(query: JsonPathToken[], char: string): { prepend?: true; delineate?: true } {
    let top = this.stack.top();
    switch (this.type) {
      case "unknown":
        if (char === "{") {
          this.type = "object";
          this.stack.push({ type: "object", value: "." });
        } else if (char === "[") {
          this.type = "unknown";
          this.stack.push({ type: "array", value: "[]", index: 0 });
          this.stack.push({ type: "index", value: 0 });
        } else if (char === '"') {
          this.type = "string";
          this.value = '"';
        } else if (/^[0-9-]$/.test(char)) {
          this.type = "number";
          this.value = char;
        } else if (char === "t" || char === "f") {
          this.type = "boolean";
          this.value = char;
        } else if (char === "n") {
          this.type = "null";
          this.value = char;
        } else if (char === "}") {
          this.type = "unknown";
          while (this.stack.top().type !== "object") {
            this.stack.pop();
          }
          this.stack.pop();
        } else if (char === "]") {
          this.type = "unknown";
          while (this.stack.top().type !== "array") {
            this.stack.pop();
          }
          this.stack.pop();
        } else if (char === "," && top.type === "index") {
          this.type = "unknown";
          this.stack.pop();
          top = this.stack.top();
          if (top.type === "array") {
            top.index++;
            this.stack.push({ type: "index", value: top.index });
          }
          return { delineate: true };
        } else if (char === ",") {
          if (this.stack.top().type === "field") {
            this.stack.pop();
          }
          this.type = "object";
        } else if (char.trim() === "") {
          // Ignore whitespace
        } else {
          throw new Error(
            `Unexpected character "${char}" in JSON path at '${colorize(this.cache, { color: "blue" })}'[${this.cursor}].`,
          );
        }
        break;
      case "object":
        if (char === '"') {
          this.type = "field";
          this.value = "";
        } else if (char.trim() === "") {
          // Ignore whitespace
        } else if (char === "}") {
          this.type = "unknown";
          while (this.stack.top().type !== "object") {
            this.stack.pop();
          }
          this.stack.pop();
        } else {
          console.log(inspect(this.stack, undefined, 10, true));
          throw new Error(
            `Unexpected character "${char}" in JSON object at '${colorize(this.cache, { color: "blue" })}'[${this.cursor}].`,
          );
        }
        break;
      case "field":
        if (char === '"' && !this.value.endsWith("\\")) {
          this.type = "closed";
        } else {
          this.value += char;
        }
        break;
      case "closed":
        if (char === ":") {
          this.type = "unknown";
          this.stack.push({ type: "field", value: this.value });
        } else {
          throw new Error(
            `Unexpected character "${char}" after closed JSON field at '${colorize(this.cache, { color: "blue" })}'[${this.cursor}].`,
          );
        }
        break;
      case "string":
        if (char === '"' && !this.value.endsWith("\\")) {
          this.type = "unknown";
          if (this.stack.top().type === "field") {
            this.stack.pop();
          }
          return { prepend: true };
        } else {
          this.value += char;
        }
        break;
      case "number":
        if (!/^[0-9ex.+-]$/.test(char)) {
          this.type = "unknown";
          if (this.stack.top().type === "field") {
            this.stack.pop();
          }
          return this.handleCharacter(query, char); // Recurse to handle this character with the updated type
        } else {
          this.value += char;
        }
        break;
      case "boolean":
        if (/^(true|false)$/.test(this.value)) {
          this.type = "unknown";
          if (this.stack.top().type === "field") {
            this.stack.pop();
          }
          return this.handleCharacter(query, char); // Recurse to handle this character with the updated type
        } else {
          this.value += char;
        }
        break;
      case "null":
        if (/^null$/.test(this.value)) {
          this.type = "unknown";
          if (this.stack.top().type === "field") {
            this.stack.pop();
          }
          return this.handleCharacter(query, char); // Recurse to handle this character with the updated type
        } else {
          this.value += char;
        }
        break;
      default:
        return {};
    }
    return {};
  }

  matchesToken(target: JsonPathToken | undefined, query: JsonPathToken | undefined, delineate: boolean): boolean {
    if (!target || !query) return false;

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
        return (
          !delineate &&
          target.type === "index" &&
          (query.value[0] === Infinity || target.value >= query.value[0]) &&
          (query.value[1] === Infinity || target.value < query.value[1])
        );
      case "wildcard":
        return ["field", "index", "object", "array"].includes(target.type);
      default:
        return false;
    }
  }

  matchesPath(query: JsonPathToken[], delineate: boolean): boolean {
    delineate = this.stack.length() <= query.length && delineate;
    if (this.stack.at(0)?.type === "eof") {
      return false; // No matches possible if the stack starts with EOF
    } else if (query[0]?.type === "root" && this.stack.at(0)?.type === "root") {
      for (let i = 1; i < query.length; i++) {
        const queryToken = query[i];
        const targetToken = this.stack.at(i);
        if (!this.matchesToken(targetToken, queryToken, delineate)) {
          return false;
        }
      }
      return true;
    } else {
      for (let i = 0; i < this.stack.length(); i++) {
        for (let j = 0; j < query.length - i; j++) {
          const queryToken = query[j];
          const targetToken = this.stack.at(i + j);
          if (this.matchesToken(targetToken, queryToken, delineate)) {
            if (j === query.length - 1) {
              return true; // Match found
            }
            continue; // Continue to next stack item
          }
        }
      }
      return false;
    }
  }
}
