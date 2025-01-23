import { generateActions, generateSelectors, generateTypes } from "../util";

export const key = "units";

// read units
export const READ_UNITS = generateTypes(key, "all");
export const [readUnits, readUnitsSuccess, readUnitsError, readUnitsBusy, readUnitsPoll] = generateActions(READ_UNITS);
export const [selectReadUnits, selectReadUnitsError, selectReadUnitsBusy, selectReadUnitsPoll, selectReadUnitsRequest] =
  generateSelectors(READ_UNITS);

// filter units
export const FILTER_UNITS = generateTypes(key, "filter");
export const [filterUnits, filterUnitsSuccess, filterUnitsError, filterUnitsBusy, filterUnitsPoll] =
  generateActions(FILTER_UNITS);
export const [
  selectFilterUnits,
  selectFilterUnitsError,
  selectFilterUnitsBusy,
  selectFilterUnitsPoll,
  selectFilterUnitsRequest,
] = generateSelectors(FILTER_UNITS);

// create unit
export const CREATE_UNIT = generateTypes(key, "create");
export const [createUnit, createUnitSuccess, createUnitError, createUnitBusy] = generateActions(CREATE_UNIT);
export const [selectCreateUnit, selectCreateUnitError, selectCreateUnitBusy, , selectCreateUnitRequest] =
  generateSelectors(CREATE_UNIT);

// read unit
export const READ_UNIT = generateTypes(key, "read");
export const [readUnit, readUnitSuccess, readUnitError, readUnitBusy, readUnitPoll] = generateActions(READ_UNIT);
export const [selectUnit, selectUnitError, selectUnitBusy, selectUnitPoll, selectUnitRequest] =
  generateSelectors(READ_UNIT);

// update unit
export const UPDATE_UNIT = generateTypes(key, "update");
export const [updateUnit, updateUnitSuccess, updateUnitError, updateUnitBusy] = generateActions(UPDATE_UNIT);
export const [selectUpdateUnit, selectUpdateUnitError, selectUpdateUnitBusy, , selectUpdateUnitRequest] =
  generateSelectors(UPDATE_UNIT);

// delete unit
export const DELETE_UNIT = generateTypes(key, "delete");
export const [deleteUnit, deleteUnitSuccess, deleteUnitError, deleteUnitBusy] = generateActions(DELETE_UNIT);
export const [selectDeleteUnit, selectDeleteUnitError, selectDeleteUnitBusy, , selectDeleteUnitRequest] =
  generateSelectors(DELETE_UNIT);
