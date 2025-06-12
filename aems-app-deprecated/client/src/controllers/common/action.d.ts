import { RouteType } from "routes/types";
import { Tree } from "utils/tree";
import { IServerModel } from "controllers/models/action";

export interface IMode {
  mode?: string;
  modes?: Array<string>;
}

export interface INotice {
  viewed?: boolean;
}

export const key: string = "common";

export function reset(): void;

export function setMode(mode?: IMode): void;
export function selectMode(state: any): IMode;

export function setNotice(notice?: INotice): void;
export function selectNotice(state: any): INotice;

export function doLoad(): void;
export function selectLoad(state: any): true | undefined;

export interface DynamicRouteType<T extends unknown> extends RouteType {
  buildProps?: () => T;
}

export function updateRoutes();
export function selectRoutes(state?: any): Tree<RouteType>;

export function setPreviousRoute(route: RouteType);
export function selectPreviousRoute(state?: any): RouteType | undefined;

export function setCurrentRoute(route: RouteType);
export function selectCurrentRoute(state?: any): RouteType;

export function setMessage(message: string);
export function selectMessage(state?: any): string | undefined;

export function setCurrentModel(model: IServerModel | undefined);
export function selectCurrentModel(state?: any): IServerModel | undefined;

export function setCurrentDialogue(dialogue: string | undefined);
export function selectCurrentDialogue(state?: any): string | undefined;

export function selectDefaultModels(state?: any);