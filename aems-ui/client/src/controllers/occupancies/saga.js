import { BUSY_AUTO, BUSY_GLOBAL, BUSY_USER } from "../busy/action";
import {
  CREATE_OCCUPANCY,
  DELETE_OCCUPANCY,
  FILTER_OCCUPANCIES,
  READ_OCCUPANCIES,
  READ_OCCUPANCY,
  UPDATE_OCCUPANCY,
  createOccupancyBusy,
  createOccupancyError,
  createOccupancySuccess,
  deleteOccupancyBusy,
  deleteOccupancyError,
  deleteOccupancySuccess,
  filterOccupanciesBusy,
  filterOccupanciesError,
  filterOccupanciesSuccess,
  readOccupanciesBusy,
  readOccupanciesError,
  readOccupanciesSuccess,
  readOccupancyBusy,
  readOccupancyError,
  readOccupancySuccess,
  selectFilterOccupanciesRequest,
  selectReadOccupancies,
  updateOccupancyBusy,
  updateOccupancyError,
  updateOccupancySuccess,
} from "./action";
import { call, delay, put, select, takeEvery, takeLatest } from "redux-saga/effects";
import { createOccupancy, deleteOccupancy, readOccupancies, readOccupancy, updateOccupancy } from "./api";

import { ActionTypes } from "../util";
import { filter } from "../../utils/async";
import { logError } from "../../utils/utils";
import { merge } from "lodash";
import moment from "moment";

const { REQUEST } = ActionTypes;

export function* readOccupanciesSaga() {
  try {
    const data = yield select(selectReadOccupancies);
    yield put(readOccupanciesBusy(data !== undefined ? true : BUSY_GLOBAL));
    yield put(readOccupanciesError());
    const response = yield call(readOccupancies);
    yield put(readOccupanciesSuccess(response));
    const request = yield select(selectFilterOccupanciesRequest);
    yield call(filterOccupanciesSaga, filterOccupancies(merge(request, { auto: true })));
  } catch (error) {
    logError(error);
    yield put(readOccupanciesError(error.message));
  } finally {
    yield put(readOccupanciesBusy(false));
  }
}

export const filterOccupancies = (occupancies, field, direction, search) => {
  if (!Array.isArray(occupancies)) {
    return occupancies;
  }
  let result = occupancies.slice();
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

export function* filterOccupanciesSaga(action) {
  const { field, direction, search, auto } = action.payload ? action.payload : {};
  try {
    yield delay(parseInt(process.env.REACT_APP_DEBOUNCE));
    yield put(filterOccupanciesBusy(auto ? BUSY_AUTO : BUSY_USER));
    yield put(filterOccupanciesError());
    const occupancies = yield select(selectReadOccupancies);
    const response = yield call(filterOccupancies, occupancies, field, direction, search);
    yield put(filterOccupanciesSuccess(response));
  } catch (error) {
    logError(error);
    yield put(filterOccupanciesError(error.message));
  } finally {
    yield put(filterOccupanciesBusy(false));
  }
}

export function* createOccupancySaga(action) {
  const body = action.payload;
  try {
    yield put(createOccupancyBusy(BUSY_GLOBAL));
    yield put(createOccupancyError());
    const response = yield call(createOccupancy, body);
    yield put(createOccupancySuccess(response));
    yield call(readOccupanciesSaga);
  } catch (error) {
    logError(error);
    yield put(createOccupancyError(error.message));
  } finally {
    yield put(createOccupancyBusy(false));
  }
}

export function* readOccupancySaga(action) {
  const body = action.payload;
  try {
    yield put(readOccupancyBusy(true));
    yield put(readOccupancyError());
    const response = yield call(readOccupancy, body);
    yield put(readOccupancySuccess(response));
  } catch (error) {
    logError(error);
    yield put(readOccupancyError(error.message));
  } finally {
    yield put(readOccupancyBusy(false));
  }
}

export function* updateOccupancySaga(action) {
  const body = action.payload;
  const { id } = body;
  try {
    yield put(updateOccupancyBusy(BUSY_GLOBAL));
    yield put(updateOccupancyError());
    const response = yield call(updateOccupancy, id, body);
    yield put(updateOccupancySuccess(response));
    yield call(readOccupanciesSaga);
  } catch (error) {
    logError(error);
    yield put(updateOccupancyError(error.message));
  } finally {
    yield put(updateOccupancyBusy(false));
  }
}

export function* deleteOccupancySaga(action) {
  const body = action.payload;
  try {
    yield put(deleteOccupancyBusy(BUSY_GLOBAL));
    yield put(deleteOccupancyError());
    const response = yield call(deleteOccupancy, body);
    yield put(deleteOccupancySuccess(response));
    yield call(readOccupanciesSaga);
  } catch (error) {
    logError(error);
    yield put(deleteOccupancyError(error.message));
  } finally {
    yield put(deleteOccupancyBusy(false));
  }
}

export default function* occupanciesSaga() {
  yield takeLatest(READ_OCCUPANCIES[REQUEST], readOccupanciesSaga);
  yield takeLatest(FILTER_OCCUPANCIES[REQUEST], filterOccupanciesSaga);
  yield takeEvery(CREATE_OCCUPANCY[REQUEST], createOccupancySaga);
  yield takeLatest(READ_OCCUPANCY[REQUEST], readOccupancySaga);
  yield takeEvery(UPDATE_OCCUPANCY[REQUEST], updateOccupancySaga);
  yield takeEvery(DELETE_OCCUPANCY[REQUEST], deleteOccupancySaga);
}
