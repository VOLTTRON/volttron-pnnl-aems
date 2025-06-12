import { generateActions, generateSelectors, generateTypes } from "../util";

export const key = "setpoints";

// read setpoints
export const READ_SETPOINTS = generateTypes(key, "all");
export const [readSetpoints, readSetpointsSuccess, readSetpointsError, readSetpointsBusy, readSetpointsPoll] =
  generateActions(READ_SETPOINTS);
export const [
  selectReadSetpoints,
  selectReadSetpointsError,
  selectReadSetpointsBusy,
  selectReadSetpointsPoll,
  selectReadSetpointsRequest,
] = generateSelectors(READ_SETPOINTS);

// filter setpoints
export const FILTER_SETPOINTS = generateTypes(key, "filter");
export const [filterSetpoints, filterSetpointsSuccess, filterSetpointsError, filterSetpointsBusy, filterSetpointsPoll] =
  generateActions(FILTER_SETPOINTS);
export const [
  selectFilterSetpoints,
  selectFilterSetpointsError,
  selectFilterSetpointsBusy,
  selectFilterSetpointsPoll,
  selectFilterSetpointsRequest,
] = generateSelectors(FILTER_SETPOINTS);

// create setpoint
export const CREATE_SETPOINT = generateTypes(key, "create");
export const [createSetpoint, createSetpointSuccess, createSetpointError, createSetpointBusy] =
  generateActions(CREATE_SETPOINT);
export const [
  selectCreateSetpoint,
  selectCreateSetpointError,
  selectCreateSetpointBusy,
  ,
  selectCreateSetpointRequest,
] = generateSelectors(CREATE_SETPOINT);

// read setpoint
export const READ_SETPOINT = generateTypes(key, "read");
export const [readSetpoint, readSetpointSuccess, readSetpointError, readSetpointBusy, readSetpointPoll] =
  generateActions(READ_SETPOINT);
export const [selectSetpoint, selectSetpointError, selectSetpointBusy, selectSetpointPoll, selectSetpointRequest] =
  generateSelectors(READ_SETPOINT);

// update setpoint
export const UPDATE_SETPOINT = generateTypes(key, "update");
export const [updateSetpoint, updateSetpointSuccess, updateSetpointError, updateSetpointBusy] =
  generateActions(UPDATE_SETPOINT);
export const [
  selectUpdateSetpoint,
  selectUpdateSetpointError,
  selectUpdateSetpointBusy,
  ,
  selectUpdateSetpointRequest,
] = generateSelectors(UPDATE_SETPOINT);

// delete setpoint
export const DELETE_SETPOINT = generateTypes(key, "delete");
export const [deleteSetpoint, deleteSetpointSuccess, deleteSetpointError, deleteSetpointBusy] =
  generateActions(DELETE_SETPOINT);
export const [
  selectDeleteSetpoint,
  selectDeleteSetpointError,
  selectDeleteSetpointBusy,
  ,
  selectDeleteSetpointRequest,
] = generateSelectors(DELETE_SETPOINT);
