import { BusyAuto, BusyUser } from "controllers/busy/action";
import { DeepPartial } from "../../utils/types";

export interface IHoliday {
  id?: number;
  type: "Enabled" | "Disabled" | "Custom";
  label: string;
  month?: number | null;
  day?: number | null;
  observance?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    [key: string]: number;
  };
  action?: "create" | "delete"
}

export interface IFilter {
  field?: "id" | "label" | "month" | "day" | "observance" | "createdAt" | "updatedAt";
  direction?: "asc" | "dsc";
  search?: string;
  auto?: boolean;
}

export function createHoliday(payload: DeepPartial<IHoliday>): void;
export function selectCreateHolidayError(state: any): any | undefined;
export function selectCreateHoliday(state: any): IHoliday | undefined;
export function selectCreateHolidayBusy(state: any): boolean | undefined;
export function selectCreateHolidayRequest(state: any): DeepPartial<IHoliday> | undefined;

export function readHolidays(): void;
export function selectReadHolidays(state: any): List<IHoliday> | undefined;

export function filterHolidays(payload: IFilter): void;
export function selectFilterHolidays(state: any): List<IHoliday> | undefined;
export function selectFilterHolidaysBusy(state: any): boolean | { type: BusyAuto | BusyUser } | undefined;

export function readHoliday(payload: number): void;
export function selectReadHoliday(state: any): IHoliday | undefined;

export function updateHoliday(payload: DeepPartial<IHoliday>): void;
export function selectUpdateHoliday(state: any): IHoliday | undefined;

export function deleteHoliday(payload: number): void;
export function selectDeleteHoliday(state: any): IHoliday | undefined;
