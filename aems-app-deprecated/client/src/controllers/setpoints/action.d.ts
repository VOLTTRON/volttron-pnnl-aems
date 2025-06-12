import { BusyAuto, BusyUser } from "controllers/busy/action";
import { DeepPartial } from "../../utils/types";

export interface ISetpoint {
  id?: number;
  label: string;
  setpoint: number;
  deadband: number;
  heating: number;
  cooling: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    [key: string]: number;
  };
}

export interface IFilter {
  field?: "id" | "label" | "setpoint" | "deadband" | "heating" | "cooling" | "createdAt" | "updatedAt";
  direction?: "asc" | "dsc";
  search?: string;
  auto?: boolean;
}

export function createSetpoint(payload: DeepPartial<ISetpoint>): void;
export function selectCreateSetpointError(state: any): any | undefined;
export function selectCreateSetpoint(state: any): ISetpoint | undefined;
export function selectCreateSetpointBusy(state: any): boolean | undefined;
export function selectCreateSetpointRequest(state: any): DeepPartial<ISetpoint> | undefined;

export function readSetpoints(): void;
export function selectReadSetpoints(state: any): List<ISetpoint> | undefined;

export function filterSetpoints(payload: IFilter): void;
export function selectFilterSetpoints(state: any): List<ISetpoint> | undefined;
export function selectFilterSetpointsBusy(state: any): boolean | { type: BusyAuto | BusyUser } | undefined;

export function readSetpoint(payload: number): void;
export function selectReadSetpoint(state: any): ISetpoint | undefined;

export function updateSetpoint(payload: DeepPartial<ISetpoint>): void;
export function selectUpdateSetpoint(state: any): ISetpoint | undefined;

export function deleteSetpoint(payload: number): void;
export function selectDeleteSetpoint(state: any): ISetpoint | undefined;
