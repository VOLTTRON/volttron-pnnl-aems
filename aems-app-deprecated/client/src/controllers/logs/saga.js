import { BUSY_AUTO, BUSY_GLOBAL, BUSY_USER } from "../busy/action";
import {
  CREATE_LOG,
  DELETE_LOG,
  FILTER_LOGS,
  READ_LOG,
  READ_LOGS,
  UPDATE_LOG,
  createLogBusy,
  createLogError,
  createLogSuccess,
  deleteLogBusy,
  deleteLogError,
  deleteLogSuccess,
  filterLogsBusy,
  filterLogsError,
  filterLogsSuccess,
  readLogBusy,
  readLogError,
  readLogSuccess,
  readLogsBusy,
  readLogsError,
  readLogsSuccess,
  selectFilterLogsRequest,
  selectReadLogs,
  updateLogBusy,
  updateLogError,
  updateLogSuccess,
} from "./action";
import { call, delay, put, select, takeEvery, takeLatest } from "redux-saga/effects";
import { createLog, deleteLog, readLog, readLogs, updateLog } from "./api";

import { ActionTypes } from "../util";
import { filter } from "../../utils/async";
import { logError } from "../../utils/utils";
import { merge } from "lodash";
import moment from "moment";

const { REQUEST } = ActionTypes;

export function* readLogsSaga(action) {
  const query = action?.payload;
  try {
    const data = yield select(selectReadLogs);
    yield put(readLogsBusy(data !== undefined ? true : BUSY_GLOBAL));
    yield put(readLogsError());
    const response = yield call(readLogs, query);
    yield put(readLogsSuccess(response));
    const request = yield select(selectFilterLogsRequest);
    yield call(filterLogsSaga, filterLogs(merge(request, { auto: true })));
  } catch (error) {
    logError(error);
    yield put(readLogsError(error.message));
  } finally {
    yield put(readLogsBusy(false));
  }
}

export const filterLogs = (logs, field, direction, search) => {
  if (!Array.isArray(logs)) {
    return logs;
  }
  let result = logs.slice();
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
          case "sequence":
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
          case "sequence":
            comparator = (a, b) => b[field] < a[field];
            break;
          default:
            comparator = (a, b) => (b[field] || "").localeCompare(a[field] || "");
        }
        break;
    }
    result = result.sort(comparator);
  }
  return filter(result, search, ["type", "message"]);
};

export function* filterLogsSaga(action) {
  const { field, direction, search, auto } = action.payload ? action.payload : {};
  try {
    yield delay(parseInt(process.env.REACT_APP_DEBOUNCE));
    yield put(filterLogsBusy(auto ? BUSY_AUTO : BUSY_USER));
    yield put(filterLogsError());
    const logs = yield select(selectReadLogs);
    const response = yield call(filterLogs, logs, field, direction, search);
    yield put(filterLogsSuccess(response));
  } catch (error) {
    logError(error);
    yield put(filterLogsError(error.message));
  } finally {
    yield put(filterLogsBusy(false));
  }
}

export function* createLogSaga(action) {
  const body = action.payload;
  try {
    yield put(createLogBusy(BUSY_GLOBAL));
    yield put(createLogError());
    const response = yield call(createLog, body);
    yield put(createLogSuccess(response));
    yield call(readLogsSaga);
  } catch (error) {
    logError(error);
    yield put(createLogError(error.message));
  } finally {
    yield put(createLogBusy(false));
  }
}

export function* readLogSaga(action) {
  const body = action.payload;
  try {
    yield put(readLogBusy(true));
    yield put(readLogError());
    const response = yield call(readLog, body);
    yield put(readLogSuccess(response));
  } catch (error) {
    logError(error);
    yield put(readLogError(error.message));
  } finally {
    yield put(readLogBusy(false));
  }
}

export function* updateLogSaga(action) {
  const body = action.payload;
  const { id } = body;
  try {
    yield put(updateLogBusy(BUSY_GLOBAL));
    yield put(updateLogError());
    const response = yield call(updateLog, id, body);
    yield put(updateLogSuccess(response));
    yield call(readLogsSaga);
  } catch (error) {
    logError(error);
    yield put(updateLogError(error.message));
  } finally {
    yield put(updateLogBusy(false));
  }
}

export function* deleteLogSaga(action) {
  const body = action.payload;
  try {
    yield put(deleteLogBusy(BUSY_GLOBAL));
    yield put(deleteLogError());
    const response = yield call(deleteLog, body);
    yield put(deleteLogSuccess(response));
    yield call(readLogsSaga);
  } catch (error) {
    logError(error);
    yield put(deleteLogError(error.message));
  } finally {
    yield put(deleteLogBusy(false));
  }
}

export default function* logsSaga() {
  yield takeLatest(READ_LOGS[REQUEST], readLogsSaga);
  yield takeLatest(FILTER_LOGS[REQUEST], filterLogsSaga);
  yield takeEvery(CREATE_LOG[REQUEST], createLogSaga);
  yield takeLatest(READ_LOG[REQUEST], readLogSaga);
  yield takeEvery(UPDATE_LOG[REQUEST], updateLogSaga);
  yield takeEvery(DELETE_LOG[REQUEST], deleteLogSaga);
}
