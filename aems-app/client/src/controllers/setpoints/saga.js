import { BUSY_AUTO, BUSY_GLOBAL, BUSY_USER } from "../busy/action";
import {
  CREATE_SETPOINT,
  DELETE_SETPOINT,
  FILTER_SETPOINTS,
  READ_SETPOINT,
  READ_SETPOINTS,
  UPDATE_SETPOINT,
  createSetpointBusy,
  createSetpointError,
  createSetpointSuccess,
  deleteSetpointBusy,
  deleteSetpointError,
  deleteSetpointSuccess,
  filterSetpointsBusy,
  filterSetpointsError,
  filterSetpointsSuccess,
  readSetpointBusy,
  readSetpointError,
  readSetpointSuccess,
  readSetpointsBusy,
  readSetpointsError,
  readSetpointsSuccess,
  selectFilterSetpointsRequest,
  selectReadSetpoints,
  updateSetpointBusy,
  updateSetpointError,
  updateSetpointSuccess,
} from "./action";
import { call, delay, put, select, takeEvery, takeLatest } from "redux-saga/effects";
import { createSetpoint, deleteSetpoint, readSetpoint, readSetpoints, updateSetpoint } from "./api";

import { ActionTypes } from "../util";
import { filter } from "../../utils/async";
import { logError } from "../../utils/utils";
import { merge } from "lodash";
import moment from "moment";

const { REQUEST } = ActionTypes;

export function* readSetpointsSaga() {
  try {
    const data = yield select(selectReadSetpoints);
    yield put(readSetpointsBusy(data !== undefined ? true : BUSY_GLOBAL));
    yield put(readSetpointsError());
    const response = yield call(readSetpoints);
    yield put(readSetpointsSuccess(response));
    const request = yield select(selectFilterSetpointsRequest);
    yield call(filterSetpointsSaga, filterSetpoints(merge(request, { auto: true })));
  } catch (error) {
    logError(error);
    yield put(readSetpointsError(error.message));
  } finally {
    yield put(readSetpointsBusy(false));
  }
}

export const filterSetpoints = (setpoints, field, direction, search) => {
  if (!Array.isArray(setpoints)) {
    return setpoints;
  }
  let result = setpoints.slice();
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
          case "setpoint":
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
          case "setpoint":
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

export function* filterSetpointsSaga(action) {
  const { field, direction, search, auto } = action.payload ? action.payload : {};
  try {
    yield delay(parseInt(process.env.REACT_APP_DEBOUNCE));
    yield put(filterSetpointsBusy(auto ? BUSY_AUTO : BUSY_USER));
    yield put(filterSetpointsError());
    const setpoints = yield select(selectReadSetpoints);
    const response = yield call(filterSetpoints, setpoints, field, direction, search);
    yield put(filterSetpointsSuccess(response));
  } catch (error) {
    logError(error);
    yield put(filterSetpointsError(error.message));
  } finally {
    yield put(filterSetpointsBusy(false));
  }
}

export function* createSetpointSaga(action) {
  const body = action.payload;
  try {
    yield put(createSetpointBusy(BUSY_GLOBAL));
    yield put(createSetpointError());
    const response = yield call(createSetpoint, body);
    yield put(createSetpointSuccess(response));
    yield call(readSetpointsSaga);
  } catch (error) {
    logError(error);
    yield put(createSetpointError(error.message));
  } finally {
    yield put(createSetpointBusy(false));
  }
}

export function* readSetpointSaga(action) {
  const body = action.payload;
  try {
    yield put(readSetpointBusy(true));
    yield put(readSetpointError());
    const response = yield call(readSetpoint, body);
    yield put(readSetpointSuccess(response));
  } catch (error) {
    logError(error);
    yield put(readSetpointError(error.message));
  } finally {
    yield put(readSetpointBusy(false));
  }
}

export function* updateSetpointSaga(action) {
  const body = action.payload;
  const { id } = body;
  try {
    yield put(updateSetpointBusy(BUSY_GLOBAL));
    yield put(updateSetpointError());
    const response = yield call(updateSetpoint, id, body);
    yield put(updateSetpointSuccess(response));
    yield call(readSetpointsSaga);
  } catch (error) {
    logError(error);
    yield put(updateSetpointError(error.message));
  } finally {
    yield put(updateSetpointBusy(false));
  }
}

export function* deleteSetpointSaga(action) {
  const body = action.payload;
  try {
    yield put(deleteSetpointBusy(BUSY_GLOBAL));
    yield put(deleteSetpointError());
    const response = yield call(deleteSetpoint, body);
    yield put(deleteSetpointSuccess(response));
    yield call(readSetpointsSaga);
  } catch (error) {
    logError(error);
    yield put(deleteSetpointError(error.message));
  } finally {
    yield put(deleteSetpointBusy(false));
  }
}

export default function* setpointsSaga() {
  yield takeLatest(READ_SETPOINTS[REQUEST], readSetpointsSaga);
  yield takeLatest(FILTER_SETPOINTS[REQUEST], filterSetpointsSaga);
  yield takeEvery(CREATE_SETPOINT[REQUEST], createSetpointSaga);
  yield takeLatest(READ_SETPOINT[REQUEST], readSetpointSaga);
  yield takeEvery(UPDATE_SETPOINT[REQUEST], updateSetpointSaga);
  yield takeEvery(DELETE_SETPOINT[REQUEST], deleteSetpointSaga);
}
