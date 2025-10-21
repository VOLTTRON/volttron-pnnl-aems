import { generateActions, generateSelectors, generateTypes } from "../util";

export const key = "logs";

// read logs
export const READ_LOGS = generateTypes(key, "all");
export const [readLogs, readLogsSuccess, readLogsError, readLogsBusy, readLogsPoll] =
  generateActions(READ_LOGS);
export const [
  selectReadLogs,
  selectReadLogsError,
  selectReadLogsBusy,
  selectReadLogsPoll,
  selectReadLogsRequest,
] = generateSelectors(READ_LOGS);

// filter logs
export const FILTER_LOGS = generateTypes(key, "filter");
export const [filterLogs, filterLogsSuccess, filterLogsError, filterLogsBusy, filterLogsPoll] =
  generateActions(FILTER_LOGS);
export const [
  selectFilterLogs,
  selectFilterLogsError,
  selectFilterLogsBusy,
  selectFilterLogsPoll,
  selectFilterLogsRequest,
] = generateSelectors(FILTER_LOGS);

// create log
export const CREATE_LOG = generateTypes(key, "create");
export const [createLog, createLogSuccess, createLogError, createLogBusy] =
  generateActions(CREATE_LOG);
export const [
  selectCreateLog,
  selectCreateLogError,
  selectCreateLogBusy,
  ,
  selectCreateLogRequest,
] = generateSelectors(CREATE_LOG);

// read log
export const READ_LOG = generateTypes(key, "read");
export const [readLog, readLogSuccess, readLogError, readLogBusy, readLogPoll] =
  generateActions(READ_LOG);
export const [selectLog, selectLogError, selectLogBusy, selectLogPoll, selectLogRequest] =
  generateSelectors(READ_LOG);

// update log
export const UPDATE_LOG = generateTypes(key, "update");
export const [updateLog, updateLogSuccess, updateLogError, updateLogBusy] =
  generateActions(UPDATE_LOG);
export const [
  selectUpdateLog,
  selectUpdateLogError,
  selectUpdateLogBusy,
  ,
  selectUpdateLogRequest,
] = generateSelectors(UPDATE_LOG);

// delete log
export const DELETE_LOG = generateTypes(key, "delete");
export const [deleteLog, deleteLogSuccess, deleteLogError, deleteLogBusy] =
  generateActions(DELETE_LOG);
export const [
  selectDeleteLog,
  selectDeleteLogError,
  selectDeleteLogBusy,
  ,
  selectDeleteLogRequest,
] = generateSelectors(DELETE_LOG);
