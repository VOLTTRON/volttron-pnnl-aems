import { BUSY_AUTO, BUSY_GLOBAL, BUSY_USER } from "../busy/action";
import {
  CREATE_CONTROL,
  DELETE_CONTROL,
  FILTER_CONTROLS,
  READ_CONTROL,
  READ_CONTROLS,
  UPDATE_CONTROL,
  createControlBusy,
  createControlError,
  createControlSuccess,
  deleteControlBusy,
  deleteControlError,
  deleteControlSuccess,
  filterControlsBusy,
  filterControlsError,
  filterControlsSuccess,
  readControlBusy,
  readControlError,
  readControlSuccess,
  readControlsBusy,
  readControlsError,
  readControlsSuccess,
  selectFilterControlsRequest,
  selectReadControls,
  updateControlBusy,
  updateControlError,
  updateControlSuccess,
} from "./action";
import { call, delay, put, select, takeEvery, takeLatest } from "redux-saga/effects";
import { createControl, deleteControl, readControl, readControls, updateControl } from "./api";

import { ActionTypes } from "../util";
import { filter } from "../../utils/async";
import { logError } from "../../utils/utils";
import { merge } from "lodash";
import moment from "moment";

const { REQUEST } = ActionTypes;

export function* readControlsSaga() {
  try {
    const data = yield select(selectReadControls);
    yield put(readControlsBusy(data !== undefined ? true : BUSY_GLOBAL));
    yield put(readControlsError());
    const response = yield call(readControls);
    yield put(readControlsSuccess(response));
    const request = yield select(selectFilterControlsRequest);
    yield call(filterControlsSaga, filterControls(merge(request, { auto: true })));
  } catch (error) {
    logError(error);
    yield put(readControlsError(error.message));
  } finally {
    yield put(readControlsBusy(false));
  }
}

export const filterControls = (controls, field, direction, search) => {
  if (!Array.isArray(controls)) {
    return controls;
  }
  let result = controls.slice();
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

export function* filterControlsSaga(action) {
  const { field, direction, search, auto } = action.payload ? action.payload : {};
  try {
    yield delay(parseInt(process.env.REACT_APP_DEBOUNCE));
    yield put(filterControlsBusy(auto ? BUSY_AUTO : BUSY_USER));
    yield put(filterControlsError());
    const controls = yield select(selectReadControls);
    const response = yield call(filterControls, controls, field, direction, search);
    yield put(filterControlsSuccess(response));
  } catch (error) {
    logError(error);
    yield put(filterControlsError(error.message));
  } finally {
    yield put(filterControlsBusy(false));
  }
}

export function* createControlSaga(action) {
  const body = action.payload;
  try {
    yield put(createControlBusy(BUSY_GLOBAL));
    yield put(createControlError());
    const response = yield call(createControl, body);
    yield put(createControlSuccess(response));
    yield call(readControlsSaga);
  } catch (error) {
    logError(error);
    yield put(createControlError(error.message));
  } finally {
    yield put(createControlBusy(false));
  }
}

export function* readControlSaga(action) {
  const body = action.payload;
  try {
    yield put(readControlBusy(true));
    yield put(readControlError());
    const response = yield call(readControl, body);
    yield put(readControlSuccess(response));
  } catch (error) {
    logError(error);
    yield put(readControlError(error.message));
  } finally {
    yield put(readControlBusy(false));
  }
}

export function* updateControlSaga(action) {
  const body = action.payload;
  const { id } = body;
  try {
    yield put(updateControlBusy(BUSY_GLOBAL));
    yield put(updateControlError());
    const response = yield call(updateControl, id, body);
    yield put(updateControlSuccess(response));
    yield call(readControlsSaga);
  } catch (error) {
    logError(error);
    yield put(updateControlError(error.message));
  } finally {
    yield put(updateControlBusy(false));
  }
}

export function* deleteControlSaga(action) {
  const body = action.payload;
  try {
    yield put(deleteControlBusy(BUSY_GLOBAL));
    yield put(deleteControlError());
    const response = yield call(deleteControl, body);
    yield put(deleteControlSuccess(response));
    yield call(readControlsSaga);
  } catch (error) {
    logError(error);
    yield put(deleteControlError(error.message));
  } finally {
    yield put(deleteControlBusy(false));
  }
}

export default function* controlsSaga() {
  yield takeLatest(READ_CONTROLS[REQUEST], readControlsSaga);
  yield takeLatest(FILTER_CONTROLS[REQUEST], filterControlsSaga);
  yield takeEvery(CREATE_CONTROL[REQUEST], createControlSaga);
  yield takeLatest(READ_CONTROL[REQUEST], readControlSaga);
  yield takeEvery(UPDATE_CONTROL[REQUEST], updateControlSaga);
  yield takeEvery(DELETE_CONTROL[REQUEST], deleteControlSaga);
}
