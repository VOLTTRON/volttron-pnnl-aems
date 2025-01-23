import {
  generateAction,
  generateActions,
  generateSelector,
  generateSelectors,
  generateType,
  generateTypes,
} from "../util";

export const key = "busy";

// key used to specify whether a busy tokan is a global type
export const BUSY_GLOBAL = "global";
export const BUSY_AUTO = "auto";
export const BUSY_USER = "user";

// global busy state
export const BUSY_TOKENS = generateType(key, "tokens");
export const busyTokens = generateAction(BUSY_TOKENS);
export const selectBusyTokens = generateSelector(key, BUSY_TOKENS);
// test to make busy... busy
export const MAKE_BUSY = generateTypes(key, "make");
export const [makeBusy, makeBusySuccess, makeBusyError, makeBusyBusy] = generateActions(MAKE_BUSY);
export const [selectBusy, selectBusyError, selectBusyBusy] = generateSelectors(MAKE_BUSY);
