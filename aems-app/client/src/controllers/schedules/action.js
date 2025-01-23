import { generateActions, generateSelectors, generateTypes } from "../util";

export const key = "schedules";

// read schedules
export const READ_SCHEDULES = generateTypes(key, "all");
export const [readSchedules, readSchedulesSuccess, readSchedulesError, readSchedulesBusy, readSchedulesPoll] =
  generateActions(READ_SCHEDULES);
export const [
  selectReadSchedules,
  selectReadSchedulesError,
  selectReadSchedulesBusy,
  selectReadSchedulesPoll,
  selectReadSchedulesRequest,
] = generateSelectors(READ_SCHEDULES);

// filter schedules
export const FILTER_SCHEDULES = generateTypes(key, "filter");
export const [filterSchedules, filterSchedulesSuccess, filterSchedulesError, filterSchedulesBusy, filterSchedulesPoll] =
  generateActions(FILTER_SCHEDULES);
export const [
  selectFilterSchedules,
  selectFilterSchedulesError,
  selectFilterSchedulesBusy,
  selectFilterSchedulesPoll,
  selectFilterSchedulesRequest,
] = generateSelectors(FILTER_SCHEDULES);

// create schedule
export const CREATE_SCHEDULE = generateTypes(key, "create");
export const [createSchedule, createScheduleSuccess, createScheduleError, createScheduleBusy] =
  generateActions(CREATE_SCHEDULE);
export const [
  selectCreateSchedule,
  selectCreateScheduleError,
  selectCreateScheduleBusy,
  ,
  selectCreateScheduleRequest,
] = generateSelectors(CREATE_SCHEDULE);

// read schedule
export const READ_SCHEDULE = generateTypes(key, "read");
export const [readSchedule, readScheduleSuccess, readScheduleError, readScheduleBusy, readSchedulePoll] =
  generateActions(READ_SCHEDULE);
export const [selectSchedule, selectScheduleError, selectScheduleBusy, selectSchedulePoll, selectScheduleRequest] =
  generateSelectors(READ_SCHEDULE);

// update schedule
export const UPDATE_SCHEDULE = generateTypes(key, "update");
export const [updateSchedule, updateScheduleSuccess, updateScheduleError, updateScheduleBusy] =
  generateActions(UPDATE_SCHEDULE);
export const [
  selectUpdateSchedule,
  selectUpdateScheduleError,
  selectUpdateScheduleBusy,
  ,
  selectUpdateScheduleRequest,
] = generateSelectors(UPDATE_SCHEDULE);

// delete schedule
export const DELETE_SCHEDULE = generateTypes(key, "delete");
export const [deleteSchedule, deleteScheduleSuccess, deleteScheduleError, deleteScheduleBusy] =
  generateActions(DELETE_SCHEDULE);
export const [
  selectDeleteSchedule,
  selectDeleteScheduleError,
  selectDeleteScheduleBusy,
  ,
  selectDeleteScheduleRequest,
] = generateSelectors(DELETE_SCHEDULE);
