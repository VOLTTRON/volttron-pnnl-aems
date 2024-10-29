import { BusyAuto, BusyUser } from "controllers/busy/action";
import { ISchedule } from "controllers/schedules/action";
import { DeepPartial } from "../../utils/types";

export interface IOccupancy {
  id?: number;
  label: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  scheduleId?: number | null;
  schedule?: DeepPartial<ISchedule>;
  _count?: {
    [key: string]: number;
  };
  action?: "create" | "delete"
}

export interface IFilter {
  field?: "id" | "label" | "date" | "createdAt" | "updatedAt";
  direction?: "asc" | "dsc";
  search?: string;
  auto?: boolean;
}

export function createOccupancy(payload: DeepPartial<IOccupancy>): void;
export function selectCreateOccupancyError(state: any): any | undefined;
export function selectCreateOccupancy(state: any): IOccupancy | undefined;
export function selectCreateOccupancyBusy(state: any): boolean | undefined;
export function selectCreateOccupancyRequest(state: any): DeepPartial<IOccupancy> | undefined;

export function readOccupancies(): void;
export function selectReadOccupancies(state: any): List<IOccupancy> | undefined;

export function filterOccupancies(payload: IFilter): void;
export function selectFilterOccupancies(state: any): List<IOccupancy> | undefined;
export function selectFilterOccupanciesBusy(state: any): boolean | { type: BusyAuto | BusyUser } | undefined;

export function readOccupancy(payload: number): void;
export function selectReadOccupancy(state: any): IOccupancy | undefined;

export function updateOccupancy(payload: DeepPartial<IOccupancy>): void;
export function selectUpdateOccupancy(state: any): IOccupancy | undefined;

export function deleteOccupancy(payload: number): void;
export function selectDeleteOccupancy(state: any): IOccupancy | undefined;
