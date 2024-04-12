import { BusyAuto, BusyUser } from "controllers/busy/action";
import { IHoliday } from "controllers/holidays/action";
import { IOccupancy } from "controllers/occupancies/action";
import { ISchedule } from "controllers/schedules/action";
import { ISetpoint } from "controllers/setpoints/action";
import { DeepPartial } from "../../utils/types";

export interface IConfiguration {
  id?: number;
  label: string;
  createdAt: string;
  updatedAt: string;
  setpointId?: number | null;
  mondayScheduleId?: number | null;
  tuesdayScheduleId?: number | null;
  wednesdayScheduleId?: number | null;
  thursdayScheduleId?: number | null;
  fridayScheduleId?: number | null;
  saturdayScheduleId?: number | null;
  sundayScheduleId?: number | null;
  holidayScheduleId?: number | null;
  setpoint?: DeepPartial<ISetpoint>;
  mondaySchedule?: DeepPartial<ISchedule>;
  tuesdaySchedule?: DeepPartial<ISchedule>;
  wednesdaySchedule?: DeepPartial<ISchedule>;
  thursdaySchedule?: DeepPartial<ISchedule>;
  fridaySchedule?: DeepPartial<ISchedule>;
  saturdaySchedule?: DeepPartial<ISchedule>;
  sundaySchedule?: DeepPartial<ISchedule>;
  holidaySchedule?: DeepPartial<ISchedule>;
  unitId?: number | null;
  occupancies?: Array<DeepPartial<IOccupancy>>;
  holidays?: Array<DeepPartial<IHoliday>>;
  _count?: {
    [key: string]: number;
  };
}

export interface IFilter {
  field?: "id" | "label" | "createdAt" | "updatedAt";
  direction?: "asc" | "dsc";
  search?: string;
  auto?: boolean;
}

export function createConfiguration(payload: DeepPartial<IConfiguration>): void;
export function selectCreateConfigurationError(state: any): any | undefined;
export function selectCreateConfiguration(state: any): IConfiguration | undefined;
export function selectCreateConfigurationBusy(state: any): boolean | undefined;
export function selectCreateConfigurationRequest(state: any): DeepPartial<IConfiguration> | undefined;

export function readConfigurations(): void;
export function readConfigurationsPoll(payload: number | undefined): void;
export function selectReadConfigurations(state: any): List<IConfiguration> | undefined;

export function filterConfigurations(payload: IFilter): void;
export function selectFilterConfigurations(state: any): List<IConfiguration> | undefined;
export function selectFilterConfigurationsBusy(state: any): boolean | { type: BusyAuto | BusyUser } | undefined;

export function readConfiguration(payload: number): void;
export function selectReadConfiguration(state: any): IConfiguration | undefined;

export function updateConfiguration(payload: DeepPartial<IConfiguration>): void;
export function selectUpdateConfiguration(state: any): IConfiguration | undefined;

export function deleteConfiguration(payload: number): void;
export function selectDeleteConfiguration(state: any): IConfiguration | undefined;
