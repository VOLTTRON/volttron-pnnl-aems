import { BUSY_AUTO, BUSY_GLOBAL, BUSY_USER } from "../busy/action";
import {
  CREATE_HOLIDAY,
  DELETE_HOLIDAY,
  FILTER_HOLIDAYS,
  READ_HOLIDAY,
  READ_HOLIDAYS,
  UPDATE_HOLIDAY,
  createHolidayBusy,
  createHolidayError,
  createHolidaySuccess,
  deleteHolidayBusy,
  deleteHolidayError,
  deleteHolidaySuccess,
  filterHolidaysBusy,
  filterHolidaysError,
  filterHolidaysSuccess,
  readHolidayBusy,
  readHolidayError,
  readHolidaySuccess,
  readHolidaysBusy,
  readHolidaysError,
  readHolidaysSuccess,
  selectFilterHolidaysRequest,
  selectReadHolidays,
  updateHolidayBusy,
  updateHolidayError,
  updateHolidaySuccess,
} from "./action";
import { call, delay, put, select, takeEvery, takeLatest } from "redux-saga/effects";
import { createHoliday, deleteHoliday, readHoliday, readHolidays, updateHoliday } from "./api";

import { ActionTypes } from "../util";
import { filter } from "../../utils/async";
import { logError } from "../../utils/utils";
import { merge } from "lodash";
import moment from "moment";

const { REQUEST } = ActionTypes;

export function* readHolidaysSaga() {
  try {
    const data = yield select(selectReadHolidays);
    yield put(readHolidaysBusy(data !== undefined ? true : BUSY_GLOBAL));
    yield put(readHolidaysError());
    const response = yield call(readHolidays);
    yield put(readHolidaysSuccess(response));
    const request = yield select(selectFilterHolidaysRequest);
    yield call(filterHolidaysSaga, filterHolidays(merge(request, { auto: true })));
  } catch (error) {
    logError(error);
    yield put(readHolidaysError(error.message));
  } finally {
    yield put(readHolidaysBusy(false));
  }
}

export const filterHolidays = (holidays, field, direction, search) => {
  if (!Array.isArray(holidays)) {
    return holidays;
  }
  let result = holidays.slice();
  if (field && direction) {
    let comparator;
    switch (direction) {
      case "asc":
        switch (field) {
          case "createdAt":
          case "updatedAt":
            comparator = (a, b) => moment(a[field]).valueOf() - moment(b[field]).valueOf();
            break;
          case "id":
          case "holiday":
          case "deadband":
          case "heating":
          case "cooling":
            comparator = (a, b) => a[field] < b[field];
            break;
          default:
            comparator = (a, b) => (a[field] || "").localeCompare(b[field] || "");
        }
        break;
      default:
        switch (field) {
          case "createdAt":
          case "updatedAt":
            comparator = (a, b) => moment(b[field]).valueOf() - moment(a[field]).valueOf();
            break;
          case "id":
          case "heating":
          case "cooling":
          case "holiday":
          case "deadband":
            comparator = (a, b) => b[field] < a[field];
            break;
          default:
            comparator = (a, b) => (b[field] || "").localeCompare(a[field] || "");
        }
        break;
    }
    result = result.sort(comparator);
  }
  return filter(result, search, ["name", "label"]);
};

export function* filterHolidaysSaga(action) {
  const { field, direction, search, auto } = action.payload ? action.payload : {};
  try {
    yield delay(parseInt(process.env.REACT_APP_DEBOUNCE));
    yield put(filterHolidaysBusy(auto ? BUSY_AUTO : BUSY_USER));
    yield put(filterHolidaysError());
    const holidays = yield select(selectReadHolidays);
    const response = yield call(filterHolidays, holidays, field, direction, search);
    yield put(filterHolidaysSuccess(response));
  } catch (error) {
    logError(error);
    yield put(filterHolidaysError(error.message));
  } finally {
    yield put(filterHolidaysBusy(false));
  }
}

export function* createHolidaySaga(action) {
  const body = action.payload;
  try {
    yield put(createHolidayBusy(BUSY_GLOBAL));
    yield put(createHolidayError());
    const response = yield call(createHoliday, body);
    yield put(createHolidaySuccess(response));
    yield call(readHolidaysSaga);
  } catch (error) {
    logError(error);
    yield put(createHolidayError(error.message));
  } finally {
    yield put(createHolidayBusy(false));
  }
}

export function* readHolidaySaga(action) {
  const body = action.payload;
  try {
    yield put(readHolidayBusy(true));
    yield put(readHolidayError());
    const response = yield call(readHoliday, body);
    yield put(readHolidaySuccess(response));
  } catch (error) {
    logError(error);
    yield put(readHolidayError(error.message));
  } finally {
    yield put(readHolidayBusy(false));
  }
}

export function* updateHolidaySaga(action) {
  const body = action.payload;
  const { id } = body;
  try {
    yield put(updateHolidayBusy(BUSY_GLOBAL));
    yield put(updateHolidayError());
    const response = yield call(updateHoliday, id, body);
    yield put(updateHolidaySuccess(response));
    yield call(readHolidaysSaga);
  } catch (error) {
    logError(error);
    yield put(updateHolidayError(error.message));
  } finally {
    yield put(updateHolidayBusy(false));
  }
}

export function* deleteHolidaySaga(action) {
  const body = action.payload;
  try {
    yield put(deleteHolidayBusy(BUSY_GLOBAL));
    yield put(deleteHolidayError());
    const response = yield call(deleteHoliday, body);
    yield put(deleteHolidaySuccess(response));
    yield call(readHolidaysSaga);
  } catch (error) {
    logError(error);
    yield put(deleteHolidayError(error.message));
  } finally {
    yield put(deleteHolidayBusy(false));
  }
}

export default function* holidaysSaga() {
  yield takeLatest(READ_HOLIDAYS[REQUEST], readHolidaysSaga);
  yield takeLatest(FILTER_HOLIDAYS[REQUEST], filterHolidaysSaga);
  yield takeEvery(CREATE_HOLIDAY[REQUEST], createHolidaySaga);
  yield takeLatest(READ_HOLIDAY[REQUEST], readHolidaySaga);
  yield takeEvery(UPDATE_HOLIDAY[REQUEST], updateHolidaySaga);
  yield takeEvery(DELETE_HOLIDAY[REQUEST], deleteHolidaySaga);
}
