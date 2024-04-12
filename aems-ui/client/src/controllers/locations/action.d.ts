import { BusyAuto, BusyUser } from "controllers/busy/action";
import { DeepPartial } from "../../utils/types";

export interface ILocation {
  id?: number;
  name?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    [key: string]: number;
  };
}

export interface IFilter {
  field?: "id" | "name" | "createdAt" | "updatedAt";
  direction?: "asc" | "dsc";
  search?: string;
  auto?: boolean;
}

export function createLocation(payload: DeepPartial<ILocation>): void;
export function selectCreateLocationError(state: any): any | undefined;
export function selectCreateLocation(state: any): ILocation | undefined;
export function selectCreateLocationBusy(state: any): boolean | undefined;
export function selectCreateLocationRequest(state: any): DeepPartial<ILocation> | undefined;

export function readLocations(): void;
export function selectReadLocations(state: any): List<ILocation> | undefined;

export function filterLocations(payload: IFilter): void;
export function selectFilterLocations(state: any): List<ILocation> | undefined;
export function selectFilterLocationsBusy(state: any): boolean | { type: BusyAuto | BusyUser } | undefined;

export function readLocation(payload: number): void;
export function selectReadLocation(state: any): ILocation | undefined;

export function updateLocation(payload: DeepPartial<ILocation>): void;
export function selectUpdateLocation(state: any): ILocation | undefined;

export function deleteLocation(payload: number): void;
export function selectDeleteLocation(state: any): ILocation | undefined;

export function readLocationsSearch(): void;
export function selectLocationsSearch(state: any): { autoComplete: boolean; addressSearch: boolean } | undefined;

export function queryLocationsSearch(payload: { search?: string; auto?: boolean }): void;
export function selectQueryLocationsSearch(state: any): (any & {})[] | undefined;
export function selectQueryLocationsSearchBusy(state: any): boolean | { type: BusyAuto | BusyUser } | undefined;
