import { BusyAuto, BusyUser } from "controllers/busy/action";
import { DeepPartial } from "../../utils/types";

export interface ILog {
  id?: number;
  sequence?: number;
  count?: number;
  type: string;
  message: number;
  expiration: string | null;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IFilter {
  field?: "id" | "sequence" | "type" | "message" | "expiration" | "createdAt" | "updatedAt";
  direction?: "asc" | "dsc";
  search?: string;
  auto?: boolean;
}

export function createLog(payload: DeepPartial<ILog>): void;
export function selectCreateLogError(state: any): any | undefined;
export function selectCreateLog(state: any): ILog | undefined;
export function selectCreateLogBusy(state: any): boolean | undefined;
export function selectCreateLogRequest(state: any): DeepPartial<ILog> | undefined;

export function readLogs(payload?: { type: string }): void;
export function readLogsPoll(payload?: number): void;
export function selectReadLogs(state: any): List<ILog> | undefined;

export function filterLogs(payload: IFilter): void;
export function selectFilterLogs(state: any): List<ILog> | undefined;
export function selectFilterLogsBusy(state: any): boolean | { type: BusyAuto | BusyUser } | undefined;

export function readLog(payload: number): void;
export function selectReadLog(state: any): ILog | undefined;

export function updateLog(payload: DeepPartial<ILog>): void;
export function selectUpdateLog(state: any): ILog | undefined;

export function deleteLog(payload: number): void;
export function selectDeleteLog(state: any): ILog | undefined;
