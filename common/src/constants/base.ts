import { has, merge } from "lodash";

import { deepFreeze } from "../utils/util";

import { IBase, IConstant, IMatcher, IParse, IParseStrict } from ".";

abstract class Base<T extends IConstant> implements IBase<T> {
  private _matcher: IMatcher = (v) => v;
  private _values: T[];
  private _constants: Record<string, T>;
  private _keys: (keyof T)[];

  constructor(values: T[], decorator?: (constant: Base<T>, value: T) => T) {
    if (!values?.length) {
      throw new Error("Values with at least one item must be specified.");
    }
    this._values = values.map((v) => deepFreeze(decorator ? decorator(this, v) : v));
    this._constants = values.reduce((p, c) => merge(p, merge({ [c.name]: c }, { [c.label]: c })), {});
    this._keys = (Object.keys(values[0]) as (keyof T)[]).filter((k) => typeof values[0][k] === "string");
  }

  /**
   * Process all values using this function when matching them.
   */
  public get matcher() {
    return this._matcher;
  }

  /**
   * Process all values using this function when matching them.
   */
  public set matcher(matcher: IMatcher) {
    this._matcher = matcher;
  }

  /**
   * Get a list of the values.
   */
  public get values() {
    return this._values;
  }

  /**
   * Get a map of the value names and labels.
   */
  public get constants() {
    return this._constants;
  }

  parse: IParse<T> = (value) => {
    let parsed = undefined;
    if (typeof value === "number") {
      parsed = this._values[value];
    } else if (typeof value === "object" && has(value, "name")) {
      parsed = this.parse((value as IConstant).name);
    } else if (typeof value === "string") {
      parsed = this._constants[value];
      if (!parsed) {
        const t = this._matcher(value);
        parsed = this._values.find((v) => this._keys.map((k) => this._matcher(v[k] as string)).includes(t));
      }
    }
    return parsed;
  };

  parseStrict: IParseStrict<T> = (value) => {
    const parsed = this.parse(value);
    if (!parsed) {
      throw new Error(`Unknown constant for ${JSON.stringify(value, undefined, 2)}.`);
    }
    return parsed;
  };

  get length() {
    return this._values.length;
  }

  *[Symbol.iterator]() {
    for (const value of this._values) {
      yield value;
    }
  }
}

export default Base;
