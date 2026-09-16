 
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { cloneDeep, get, merge, set } from "@local/common/dist/utils/lodash";
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

export type RenderErrorPhase = "value" | "evaluate" | "map" | "reduce" | "key" | "string" | "iterate" | "parse";

export interface RenderError {
  _error: string;
  phase: RenderErrorPhase;
}

export const makeRenderError = (message: string, phase: RenderErrorPhase): RenderError => ({
  _error: message,
  phase,
});

export const isRenderError = (v: unknown): v is RenderError =>
  typeof v === "object" && v !== null && "_error" in v && typeof (v as { _error: unknown })._error === "string";

const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : String(err));

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
 * Best-effort: any failure at a specific node is captured inline as a `{_error, phase}` marker
 * (see `RenderError`) so successful sibling nodes keep rendering.
 */
export const transformTemplate = (template: any, params?: any) => {
  const transformer = (object: any, path: string, key: number | string | undefined, value: any): any => {
    if (typeof key === "string") {
      try {
        key = templateFormat(key, params);
      } catch (err) {
        const errMarker = makeRenderError(errorMessage(err), "key");
        const finalPath = path.length === 0 ? "_errorKey" : `${path}._errorKey`;
        set(object, finalPath, errMarker);
        return object;
      }
    }
    let setter = (v: any) => set(object, path, v);
    if (key === undefined) {
      path = "";
      setter = (v: any) => (object = v);
    } else {
      path = path.length === 0 ? `${key}` : `${path}.${key}`;
      setter = (v: any) => set(object, path, v);
    }
    if (isRenderError(value)) {
      setter(value);
      return object;
    }
    do {
      const type = get(value, "_type");
      if (type === undefined) break;
      try {
        switch (type) {
          case "value":
            value = applyFunction(params, value as IValue);
            break;
          case "evaluate": {
            const lookupKey = applyFunction(params, value as IEvaluate);
            const lookup = get(value, `values.${lookupKey}`, undefined);
            if (lookup === undefined || lookup === null) {
              value = makeRenderError(
                `evaluate expression "${(value as IEvaluate).expression}" produced key "${String(lookupKey)}" which is not present in values`,
                "evaluate",
              );
            } else {
              value = lookup;
            }
            break;
          }
          case "remove":
            return;
          case "map":
            value = get(params, (value as IMap).path, []).map((v: any) =>
              transformTemplate((value as IMap).value, v),
            );
            break;
          case "reduce":
            value = get(params, (value as IReduce).path, []).reduce(
              (a: any, v: any) => merge(a, transformTemplate((value as IReduce).value, v)),
              {} as any,
            );
            break;
          default:
          // continue
        }
      } catch (err) {
        value = makeRenderError(errorMessage(err), type as RenderErrorPhase);
      }
      if (isRenderError(value)) break;
      // repeat until _type actions for this path are resolved
    } while (get(value, "_type"));
    if (isRenderError(value)) {
      setter(value);
      return object;
    }
    if (typeof value === "string") {
      try {
        setter(templateFormat(value, params));
      } catch (err) {
        setter(makeRenderError(errorMessage(err), "string"));
      }
    } else if (Array.isArray(value)) {
      setter([]);
      value.forEach((v, i) => transformer(object, path, `[${i}]`, v));
    } else if (typeof value === "object" && value !== null) {
      setter({});
      try {
        Object.entries(value).forEach(([k, v]) => transformer(object, path, k, v));
      } catch (err) {
        setter(makeRenderError(errorMessage(err), "iterate"));
      }
    } else {
      setter(value);
    }
    return object;
  };
  return transformer({}, "", undefined, cloneDeep(template));
};

/**
 * Walk a rendered template tree and collect every inline `RenderError` marker.
 */
export const collectRenderErrors = (value: unknown): RenderError[] => {
  const errors: RenderError[] = [];
  const walk = (v: unknown) => {
    if (isRenderError(v)) {
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
