import { BusyAuto, BusyUser } from "controllers/busy/action";
import { IUnit } from "controllers/units/action";
import { DeepPartial } from "../../utils/types";

export interface IControl {
  id?: number;
  campus: string;
  building: string;
  label: string;
  peakLoadExclude: boolean;
  stage: string;
  createdAt: string;
  updatedAt: string;
  units: IUnit[];
}

export interface IFilter {
  field?: "id" | "label" | "campus" | "building" | "peakLoadExclude" | "stage" | "createdAt" | "updatedAt";
  direction?: "asc" | "dsc";
  search?: string;
  auto?: boolean;
}

export function createControl(payload: DeepPartial<IControl>): void;
export function selectCreateControlError(state: any): any | undefined;
export function selectCreateControl(state: any): IControl | undefined;
export function selectCreateControlBusy(state: any): boolean | undefined;
export function selectCreateControlRequest(state: any): DeepPartial<IControl> | undefined;

export function readControls(): void;
export function readControlsPoll(payload?: number): void;
export function selectReadControls(state: any): List<IControl> | undefined;

export function filterControls(payload: IFilter): void;
export function selectFilterControls(state: any): List<IControl> | undefined;
export function selectFilterControlsBusy(state: any): boolean | { type: BusyAuto | BusyUser } | undefined;

export function readControl(payload: number): void;
export function selectReadControl(state: any): IControl | undefined;

export function updateControl(payload: DeepPartial<IControl>): void;
export function selectUpdateControl(state: any): IControl | undefined;

export function deleteControl(payload: number): void;
export function selectDeleteControl(state: any): IControl | undefined;
