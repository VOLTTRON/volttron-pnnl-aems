/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { cloneDeep, get, merge, set } from "lodash";
import { Unit } from "@prisma/client";
import { templateFormat } from "@local/common";

export interface IAction {
  sources: string[];
  expression: string;
}

export interface IValue extends IAction {
  _type: "value";
  sources: string[];
  expression: string;
}

export interface IRemove {
  _type: "remove";
}

export interface IIterate {
  path: string;
  value: any;
}

export interface IMap extends IIterate {
  _type: "map";
}

export interface IReduce extends IIterate {
  _type: "reduce";
}

export interface IEvaluate extends IAction {
  _type: "evaluate";
  values: Record<string, any>;
}

const applyFunction = (unit: Unit, action: IAction): unknown => {
  return Function.apply(null, [
    ...action.sources.map((s) => s.split(".").pop() as string),
    `return ${action.expression};`,
  ])(...action.sources.map((s) => get(unit, s)));
};

/**
 * Transforms the supplied template optionally using parameters from the supplied params.
 * Supports key and value string transforms as well as `IValue`, `IRemove`, and `IEvaluate` types.
 *
 * @param template
 * @param params
 * @returns
 */
export const transformTemplate = (template: any, params?: any) => {
  const transformer = (object: any, path: string, key: number | string | undefined, value: any): any => {
    if (typeof key === "string") {
      key = templateFormat(key, params);
    }
    let setter = (v: any) => set(object, path, v);
    if (key === undefined) {
      path = "";
      setter = (v: any) => (object = v);
    } else {
      path = path.length === 0 ? `${key}` : `${path}.${key}`;
      setter = (v: any) => set(object, path, v);
    }
    do {
      switch (get(value, "_type")) {
        case "value":
          value = applyFunction(params, value as IValue);
          break;
        case "evaluate":
          value = get(value, `values.${applyFunction(params, value as IEvaluate)}`, null);
          break;
        case "remove":
          return;
        case "map":
          value = get(params, value.path, []).map((v: any) => transformTemplate(value.value, v));
          break;
        case "reduce":
          value = get(params, value.path, []).reduce(
            (a: any, v: any) => merge(a, transformTemplate(value.value, v)),
            {} as any,
          );
          break;
        default:
        // continue
      }
      // repeat until _type actions for this path are resolved
    } while (get(value, "_type"));
    if (typeof value === "string") {
      setter(templateFormat(value, params));
    } else if (Array.isArray(value)) {
      setter([]);
      value.forEach((v, i) => transformer(object, path, `[${i}]`, v));
    } else if (typeof value === "object") {
      setter({});
      Object.entries(value).forEach(([k, v]) => transformer(object, path, k, v));
    } else {
      setter(value);
    }
    return object;
  };
  return transformer({}, "", undefined, cloneDeep(template));
};
