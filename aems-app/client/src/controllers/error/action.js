import {
  generateAction,
  generateSelector,
  generateType,
  generateTypes,
  generateActions,
  generateSelectors,
} from "../util";

export const key = "error";

// global error state
export const ERROR_TOKENS = generateType(key, "tokens");
export const errorTokens = generateAction(ERROR_TOKENS);
export const selectErrorTokens = generateSelector(key, ERROR_TOKENS);
// test to clear error
export const CLEAR_ERROR = generateTypes(key, "clear");
export const [clearError, clearErrorSuccess, clearErrorError, clearErrorBusy] =
  generateActions(CLEAR_ERROR);
export const [selectError, selectErrorError, selectErrorBusy] =
  generateSelectors(CLEAR_ERROR);
