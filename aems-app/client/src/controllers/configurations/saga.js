import { BUSY_AUTO, BUSY_GLOBAL, BUSY_USER } from "../busy/action";
import {
  CREATE_CONFIGURATION,
  DELETE_CONFIGURATION,
  FILTER_CONFIGURATIONS,
  READ_CONFIGURATION,
  READ_CONFIGURATIONS,
  UPDATE_CONFIGURATION,
  createConfigurationBusy,
  createConfigurationError,
  createConfigurationSuccess,
  deleteConfigurationBusy,
  deleteConfigurationError,
  deleteConfigurationSuccess,
  filterConfigurationsBusy,
  filterConfigurationsError,
  filterConfigurationsSuccess,
  readConfigurationBusy,
  readConfigurationError,
  readConfigurationSuccess,
  readConfigurationsBusy,
  readConfigurationsError,
  readConfigurationsSuccess,
  selectFilterConfigurationsRequest,
  selectReadConfigurations,
  updateConfigurationBusy,
  updateConfigurationError,
  updateConfigurationSuccess,
} from "./action";
import { call, delay, put, select, takeEvery, takeLatest } from "redux-saga/effects";
import {
  createConfiguration,
  deleteConfiguration,
  readConfiguration,
  readConfigurations,
  updateConfiguration,
} from "./api";
import { isFinite, merge } from "lodash";

import { ActionTypes } from "../util";
import { filter } from "../../utils/async";
import { logError } from "../../utils/utils";
import moment from "moment";
import { readUnitsSaga } from "controllers/units/saga";

const { REQUEST } = ActionTypes;

export function* readConfigurationsSaga() {
  try {
    const data = yield select(selectReadConfigurations);
    yield put(readConfigurationsBusy(data ? true : BUSY_GLOBAL));
    yield put(readConfigurationsError());
    const response = yield call(readConfigurations);
    yield put(readConfigurationsSuccess(response));
    const request = yield select(selectFilterConfigurationsRequest);
    yield call(filterConfigurationsSaga, filterConfigurations(merge(request, { auto: true })));
  } catch (error) {
    logError(error);
    yield put(readConfigurationsError(error.message));
  } finally {
    yield put(readConfigurationsBusy(false));
  }
}

export const filterConfigurations = (configurations, field, direction, search) => {
  if (!Array.isArray(configurations)) {
    return configurations;
  }
  let result = configurations.slice();
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
  return filter(result, search, ["label"]);
};

export function* filterConfigurationsSaga(action) {
  const { field, direction, search, auto } = action.payload ? action.payload : {};
  try {
    yield delay(parseInt(process.env.REACT_APP_DEBOUNCE));
    yield put(filterConfigurationsBusy(auto ? BUSY_AUTO : BUSY_USER));
    yield put(filterConfigurationsError());
    const configurations = yield select(selectReadConfigurations);
    const response = yield call(filterConfigurations, configurations, field, direction, search);
    yield put(filterConfigurationsSuccess(response));
  } catch (error) {
    logError(error);
    yield put(filterConfigurationsError(error.message));
  } finally {
    yield put(filterConfigurationsBusy(false));
  }
}

export function* createConfigurationSaga(action) {
  const body = action.payload;
  try {
    yield put(createConfigurationBusy(BUSY_GLOBAL));
    yield put(createConfigurationError());
    const response = yield call(createConfiguration, body);
    yield put(createConfigurationSuccess(response));
    yield call(readConfigurationsSaga);
    if (isFinite(body?.unitId)) {
      yield call(readUnitsSaga);
    }
  } catch (error) {
    logError(error);
    yield put(createConfigurationError(error.message));
  } finally {
    yield put(createConfigurationBusy(false));
  }
}

export function* readConfigurationSaga(action) {
  const body = action.payload;
  try {
    yield put(readConfigurationBusy(true));
    yield put(readConfigurationError());
    const response = yield call(readConfiguration, body);
    yield put(readConfigurationSuccess(response));
  } catch (error) {
    logError(error);
    yield put(readConfigurationError(error.message));
  } finally {
    yield put(readConfigurationBusy(false));
  }
}

export function* updateConfigurationSaga(action) {
  const body = action.payload;
  const { id } = body;
  try {
    yield put(updateConfigurationBusy(BUSY_GLOBAL));
    yield put(updateConfigurationError());
    const response = yield call(updateConfiguration, id, body);
    yield put(updateConfigurationSuccess(response));
    yield call(readConfigurationsSaga);
  } catch (error) {
    logError(error);
    yield put(updateConfigurationError(error.message));
  } finally {
    yield put(updateConfigurationBusy(false));
  }
}

export function* deleteConfigurationSaga(action) {
  const body = action.payload;
  try {
    yield put(deleteConfigurationBusy(BUSY_GLOBAL));
    yield put(deleteConfigurationError());
    const response = yield call(deleteConfiguration, body);
    yield put(deleteConfigurationSuccess(response));
    yield call(readConfigurationsSaga);
  } catch (error) {
    logError(error);
    yield put(deleteConfigurationError(error.message));
  } finally {
    yield put(deleteConfigurationBusy(false));
  }
}

export default function* configurationsSaga() {
  yield takeLatest(READ_CONFIGURATIONS[REQUEST], readConfigurationsSaga);
  yield takeLatest(FILTER_CONFIGURATIONS[REQUEST], filterConfigurationsSaga);
  yield takeEvery(CREATE_CONFIGURATION[REQUEST], createConfigurationSaga);
  yield takeLatest(READ_CONFIGURATION[REQUEST], readConfigurationSaga);
  yield takeEvery(UPDATE_CONFIGURATION[REQUEST], updateConfigurationSaga);
  yield takeEvery(DELETE_CONFIGURATION[REQUEST], deleteConfigurationSaga);
}
