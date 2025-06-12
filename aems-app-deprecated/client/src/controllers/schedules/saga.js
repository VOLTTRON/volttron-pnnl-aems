import { BUSY_AUTO, BUSY_GLOBAL, BUSY_USER } from "../busy/action";
import {
  CREATE_SCHEDULE,
  DELETE_SCHEDULE,
  FILTER_SCHEDULES,
  READ_SCHEDULE,
  READ_SCHEDULES,
  UPDATE_SCHEDULE,
  createScheduleBusy,
  createScheduleError,
  createScheduleSuccess,
  deleteScheduleBusy,
  deleteScheduleError,
  deleteScheduleSuccess,
  filterSchedulesBusy,
  filterSchedulesError,
  filterSchedulesSuccess,
  readScheduleBusy,
  readScheduleError,
  readScheduleSuccess,
  readSchedulesBusy,
  readSchedulesError,
  readSchedulesSuccess,
  selectFilterSchedulesRequest,
  selectReadSchedules,
  updateScheduleBusy,
  updateScheduleError,
  updateScheduleSuccess,
} from "./action";
import { call, delay, put, select, takeEvery, takeLatest } from "redux-saga/effects";
import { createSchedule, deleteSchedule, readSchedule, readSchedules, updateSchedule } from "./api";

import { ActionTypes } from "../util";
import { filter } from "../../utils/async";
import { logError } from "../../utils/utils";
import { merge } from "lodash";
import moment from "moment";

const { REQUEST } = ActionTypes;

export function* readSchedulesSaga() {
  try {
    const data = yield select(selectReadSchedules);
    yield put(readSchedulesBusy(data ? true : BUSY_GLOBAL));
    yield put(readSchedulesError());
    const response = yield call(readSchedules);
    yield put(readSchedulesSuccess(response));
    const request = yield select(selectFilterSchedulesRequest);
    yield call(filterSchedulesSaga, filterSchedules(merge(request, { auto: true })));
  } catch (error) {
    logError(error);
    yield put(readSchedulesError(error.message));
  } finally {
    yield put(readSchedulesBusy(false));
  }
}

export const filterSchedules = (schedules, field, direction, search) => {
  if (!Array.isArray(schedules)) {
    return schedules;
  }
  let result = schedules.slice();
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

export function* filterSchedulesSaga(action) {
  const { field, direction, search, auto } = action.payload ? action.payload : {};
  try {
    yield delay(parseInt(process.env.REACT_APP_DEBOUNCE));
    yield put(filterSchedulesBusy(auto ? BUSY_AUTO : BUSY_USER));
    yield put(filterSchedulesError());
    const schedules = yield select(selectReadSchedules);
    const response = yield call(filterSchedules, schedules, field, direction, search);
    yield put(filterSchedulesSuccess(response));
  } catch (error) {
    logError(error);
    yield put(filterSchedulesError(error.message));
  } finally {
    yield put(filterSchedulesBusy(false));
  }
}

export function* createScheduleSaga(action) {
  const body = action.payload;
  try {
    yield put(createScheduleBusy(BUSY_GLOBAL));
    yield put(createScheduleError());
    const response = yield call(createSchedule, body);
    yield put(createScheduleSuccess(response));
    yield call(readSchedulesSaga);
  } catch (error) {
    logError(error);
    yield put(createScheduleError(error.message));
  } finally {
    yield put(createScheduleBusy(false));
  }
}

export function* readScheduleSaga(action) {
  const body = action.payload;
  try {
    yield put(readScheduleBusy(true));
    yield put(readScheduleError());
    const response = yield call(readSchedule, body);
    yield put(readScheduleSuccess(response));
  } catch (error) {
    logError(error);
    yield put(readScheduleError(error.message));
  } finally {
    yield put(readScheduleBusy(false));
  }
}

export function* updateScheduleSaga(action) {
  const body = action.payload;
  const { id } = body;
  try {
    yield put(updateScheduleBusy(BUSY_GLOBAL));
    yield put(updateScheduleError());
    const response = yield call(updateSchedule, id, body);
    yield put(updateScheduleSuccess(response));
    yield call(readSchedulesSaga);
  } catch (error) {
    logError(error);
    yield put(updateScheduleError(error.message));
  } finally {
    yield put(updateScheduleBusy(false));
  }
}

export function* deleteScheduleSaga(action) {
  const body = action.payload;
  try {
    yield put(deleteScheduleBusy(BUSY_GLOBAL));
    yield put(deleteScheduleError());
    const response = yield call(deleteSchedule, body);
    yield put(deleteScheduleSuccess(response));
    yield call(readSchedulesSaga);
  } catch (error) {
    logError(error);
    yield put(deleteScheduleError(error.message));
  } finally {
    yield put(deleteScheduleBusy(false));
  }
}

export default function* schedulesSaga() {
  yield takeLatest(READ_SCHEDULES[REQUEST], readSchedulesSaga);
  yield takeLatest(FILTER_SCHEDULES[REQUEST], filterSchedulesSaga);
  yield takeEvery(CREATE_SCHEDULE[REQUEST], createScheduleSaga);
  yield takeLatest(READ_SCHEDULE[REQUEST], readScheduleSaga);
  yield takeEvery(UPDATE_SCHEDULE[REQUEST], updateScheduleSaga);
  yield takeEvery(DELETE_SCHEDULE[REQUEST], deleteScheduleSaga);
}
