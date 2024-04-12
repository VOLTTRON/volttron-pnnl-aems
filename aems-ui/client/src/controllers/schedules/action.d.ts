import { BusyAuto, BusyUser } from "controllers/busy/action";
import { ISetpoint } from "controllers/setpoints/action";
import { DeepPartial } from "../../utils/types";

export interface ISchedule {
  id?: number;
  label: string;
  startTime: string;
  endTime: string;
  occupied: boolean;
  createdAt?: string;
  updatedAt?: string;
  setpointId?: number | null;
  setpoint?: DeepPartial<ISetpoint>;
  _count?: {
    [key: string]: number;
  };
}

export interface IFilter {
  field?: "id" | "label" | "startTime" | "endTime" | "createdAt" | "updatedAt";
  direction?: "asc" | "dsc";
  search?: string;
  auto?: boolean;
}

export function createSchedule(payload: DeepPartial<ISchedule>): void;
export function selectCreateScheduleError(state: any): any | undefined;
export function selectCreateSchedule(state: any): ISchedule | undefined;
export function selectCreateScheduleBusy(state: any): boolean | undefined;
export function selectCreateScheduleRequest(state: any): DeepPartial<ISchedule> | undefined;

export function readSchedules(): void;
export function selectReadSchedules(state: any): List<ISchedule> | undefined;

export function filterSchedules(payload: IFilter): void;
export function selectFilterSchedules(state: any): List<ISchedule> | undefined;
export function selectFilterSchedulesBusy(state: any): boolean | { type: BusyAuto | BusyUser } | undefined;

export function readSchedule(payload: number): void;
export function selectReadSchedule(state: any): ISchedule | undefined;

export function updateSchedule(payload: DeepPartial<ISchedule>): void;
export function selectUpdateSchedule(state: any): ISchedule | undefined;

export function deleteSchedule(payload: number): void;
export function selectDeleteSchedule(state: any): ISchedule | undefined;
