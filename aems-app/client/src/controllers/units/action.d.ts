import { BusyAuto, BusyUser } from "controllers/busy/action";
import { IConfiguration } from "controllers/configurations/action";
import { DeepPartial } from "../../utils/types";

export interface IUnit {
  id?: number;
  name: string;
  campus: string;
  building: string;
  system: string;
  timezone: string;
  label: string;
  coolingCapacity: number;
  compressors: number;
  coolingLockout: number;
  optimalStartLockout: number;
  optimalStartDeviation: number;
  earliestStart: number;
  latestStart: number;
  zoneLocation: string;
  zoneMass: string;
  zoneOrientation: string;
  zoneBuilding: string;
  heatPump: boolean;
  heatPumpBackup: number;
  economizer: boolean;
  heatPumpLockout: number;
  coolingPeakOffset: number;
  heatingPeakOffset: number;
  peakLoadExclude: boolean;
  economizerSetpoint: number;
  stage: string;
  createdAt: string;
  updatedAt: string;
  configurationId?: number | null;
  configuration?: DeepPartial<IConfiguration>;
  locationId?: number | null;
  location?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
  };
  _count?: {
    [key: string]: number;
  };
}

export interface IFilter {
  field?: "id" | "name" | "label" | "createdAt" | "updatedAt";
  direction?: "asc" | "dsc";
  search?: string;
  auto?: boolean;
}

export function createUnit(payload: DeepPartial<IUnit>): void;
export function selectCreateUnitError(state: any): any | undefined;
export function selectCreateUnit(state: any): IUnit | undefined;
export function selectCreateUnitBusy(state: any): boolean | undefined;
export function selectCreateUnitRequest(state: any): DeepPartial<IUnit> | undefined;

export function readUnits(): void;
export function readUnitsPoll(payload: number | undefined): void;
export function selectReadUnits(state: any): List<IUnit> | undefined;

export function filterUnits(payload: IFilter): void;
export function selectFilterUnits(state: any): List<IUnit> | undefined;
export function selectFilterUnitsBusy(state: any): boolean | { type: BusyAuto | BusyUser } | undefined;

export function readUnit(payload: number): void;
export function selectReadUnit(state: any): IUnit | undefined;

export function updateUnit(payload: DeepPartial<IUnit>): void;
export function selectUpdateUnit(state: any): IUnit | undefined;

export function deleteUnit(payload: number): void;
export function selectDeleteUnit(state: any): IUnit | undefined;
