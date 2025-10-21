import { generateActions, generateSelectors, generateTypes } from "../util";

export const key = "holidays";

// read holidays
export const READ_HOLIDAYS = generateTypes(key, "all");
export const [readHolidays, readHolidaysSuccess, readHolidaysError, readHolidaysBusy, readHolidaysPoll] =
  generateActions(READ_HOLIDAYS);
export const [
  selectReadHolidays,
  selectReadHolidaysError,
  selectReadHolidaysBusy,
  selectReadHolidaysPoll,
  selectReadHolidaysRequest,
] = generateSelectors(READ_HOLIDAYS);

// filter holidays
export const FILTER_HOLIDAYS = generateTypes(key, "filter");
export const [filterHolidays, filterHolidaysSuccess, filterHolidaysError, filterHolidaysBusy, filterHolidaysPoll] =
  generateActions(FILTER_HOLIDAYS);
export const [
  selectFilterHolidays,
  selectFilterHolidaysError,
  selectFilterHolidaysBusy,
  selectFilterHolidaysPoll,
  selectFilterHolidaysRequest,
] = generateSelectors(FILTER_HOLIDAYS);

// create holiday
export const CREATE_HOLIDAY = generateTypes(key, "create");
export const [createHoliday, createHolidaySuccess, createHolidayError, createHolidayBusy] =
  generateActions(CREATE_HOLIDAY);
export const [selectCreateHoliday, selectCreateHolidayError, selectCreateHolidayBusy, , selectCreateHolidayRequest] =
  generateSelectors(CREATE_HOLIDAY);

// read holiday
export const READ_HOLIDAY = generateTypes(key, "read");
export const [readHoliday, readHolidaySuccess, readHolidayError, readHolidayBusy, readHolidayPoll] =
  generateActions(READ_HOLIDAY);
export const [selectHoliday, selectHolidayError, selectHolidayBusy, selectHolidayPoll, selectHolidayRequest] =
  generateSelectors(READ_HOLIDAY);

// update holiday
export const UPDATE_HOLIDAY = generateTypes(key, "update");
export const [updateHoliday, updateHolidaySuccess, updateHolidayError, updateHolidayBusy] =
  generateActions(UPDATE_HOLIDAY);
export const [selectUpdateHoliday, selectUpdateHolidayError, selectUpdateHolidayBusy, , selectUpdateHolidayRequest] =
  generateSelectors(UPDATE_HOLIDAY);

// delete holiday
export const DELETE_HOLIDAY = generateTypes(key, "delete");
export const [deleteHoliday, deleteHolidaySuccess, deleteHolidayError, deleteHolidayBusy] =
  generateActions(DELETE_HOLIDAY);
export const [selectDeleteHoliday, selectDeleteHolidayError, selectDeleteHolidayBusy, , selectDeleteHolidayRequest] =
  generateSelectors(DELETE_HOLIDAY);
