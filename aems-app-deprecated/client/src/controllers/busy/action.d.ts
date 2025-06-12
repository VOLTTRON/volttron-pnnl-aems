export const BUSY_GLOBAL: string = "global";

export const BUSY_AUTO: string = "auto";

export const BUSY_USER: string = "user";

export type BusyGlobal = BUSY_GLOBAL;

export type BusyAuto = BUSY_AUTO;

export type BusyUser = BUSY_USER;

export interface BusyTokens {
  [key: string]: { type?: string; timestamp: string };
}

export function selectBusyTokens(state: any): BusyTokens;
