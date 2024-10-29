import { generateActions, generateSelectors, generateTypes } from "../util";

export const key = "controls";

// read controls
export const READ_CONTROLS = generateTypes(key, "all");
export const [readControls, readControlsSuccess, readControlsError, readControlsBusy, readControlsPoll] =
  generateActions(READ_CONTROLS);
export const [
  selectReadControls,
  selectReadControlsError,
  selectReadControlsBusy,
  selectReadControlsPoll,
  selectReadControlsRequest,
] = generateSelectors(READ_CONTROLS);

// filter controls
export const FILTER_CONTROLS = generateTypes(key, "filter");
export const [filterControls, filterControlsSuccess, filterControlsError, filterControlsBusy, filterControlsPoll] =
  generateActions(FILTER_CONTROLS);
export const [
  selectFilterControls,
  selectFilterControlsError,
  selectFilterControlsBusy,
  selectFilterControlsPoll,
  selectFilterControlsRequest,
] = generateSelectors(FILTER_CONTROLS);

// create control
export const CREATE_CONTROL = generateTypes(key, "create");
export const [createControl, createControlSuccess, createControlError, createControlBusy] =
  generateActions(CREATE_CONTROL);
export const [
  selectCreateControl,
  selectCreateControlError,
  selectCreateControlBusy,
  ,
  selectCreateControlRequest,
] = generateSelectors(CREATE_CONTROL);

// read control
export const READ_CONTROL = generateTypes(key, "read");
export const [readControl, readControlSuccess, readControlError, readControlBusy, readControlPoll] =
  generateActions(READ_CONTROL);
export const [selectControl, selectControlError, selectControlBusy, selectControlPoll, selectControlRequest] =
  generateSelectors(READ_CONTROL);

// update control
export const UPDATE_CONTROL = generateTypes(key, "update");
export const [updateControl, updateControlSuccess, updateControlError, updateControlBusy] =
  generateActions(UPDATE_CONTROL);
export const [
  selectUpdateControl,
  selectUpdateControlError,
  selectUpdateControlBusy,
  ,
  selectUpdateControlRequest,
] = generateSelectors(UPDATE_CONTROL);

// delete control
export const DELETE_CONTROL = generateTypes(key, "delete");
export const [deleteControl, deleteControlSuccess, deleteControlError, deleteControlBusy] =
  generateActions(DELETE_CONTROL);
export const [
  selectDeleteControl,
  selectDeleteControlError,
  selectDeleteControlBusy,
  ,
  selectDeleteControlRequest,
] = generateSelectors(DELETE_CONTROL);
