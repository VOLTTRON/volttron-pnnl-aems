import { BUSY_AUTO, BUSY_GLOBAL, BUSY_USER } from "../busy/action";
import {
  CREATE_LOCATION,
  DELETE_LOCATION,
  FILTER_LOCATIONS,
  READ_LOCATION,
  READ_LOCATIONS,
  UPDATE_LOCATION,
  createLocationBusy,
  createLocationError,
  createLocationSuccess,
  deleteLocationBusy,
  deleteLocationError,
  deleteLocationSuccess,
  filterLocationsBusy,
  filterLocationsError,
  filterLocationsSuccess,
  readLocationBusy,
  readLocationError,
  readLocationSuccess,
  readLocationsBusy,
  readLocationsError,
  readLocationsSuccess,
  selectFilterLocationsRequest,
  selectReadLocations,
  updateLocationBusy,
  updateLocationError,
  updateLocationSuccess,
} from "./action";
import { call, delay, put, select, takeEvery, takeLatest } from "redux-saga/effects";
import {
  createLocation,
  deleteLocation,
  queryLocationsSearch,
  readLocation,
  readLocations,
  readLocationsSearch,
  updateLocation,
} from "./api";

import { ActionTypes } from "../util";
import { filter } from "../../utils/async";
import { logError } from "../../utils/utils";
import { merge } from "lodash";
import moment from "moment";
import { queryLocationsSearchBusy } from "./action";
import { queryLocationsSearchError } from "./action";
import { queryLocationsSearchSuccess } from "./action";
import { readLocationsSearchBusy } from "./action";
import { readLocationsSearchError } from "./action";
import { readLocationsSearchSuccess } from "./action";
import { READ_LOCATIONS_SEARCH } from "./action";
import { QUERY_LOCATIONS_SEARCH } from "./action";

const { REQUEST } = ActionTypes;

export function* readLocationsSaga() {
  try {
    const data = yield select(selectReadLocations);
    yield put(readLocationsBusy(data !== undefined ? true : BUSY_GLOBAL));
    yield put(readLocationsError());
    const response = yield call(readLocations);
    yield put(readLocationsSuccess(response));
    const request = yield select(selectFilterLocationsRequest);
    yield call(filterLocationsSaga, filterLocations(merge(request, { auto: true })));
  } catch (error) {
    logError(error);
    yield put(readLocationsError(error.message));
  } finally {
    yield put(readLocationsBusy(false));
  }
}

export const filterLocations = (locations, field, direction, search) => {
  if (!Array.isArray(locations)) {
    return locations;
  }
  let result = locations.slice();
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
          case "latitude":
          case "longitude":
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
          case "latitude":
          case "longitude":
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

export function* filterLocationsSaga(action) {
  const { field, direction, search, auto } = action.payload ? action.payload : {};
  try {
    yield delay(parseInt(process.env.REACT_APP_DEBOUNCE));
    yield put(filterLocationsBusy(auto ? BUSY_AUTO : BUSY_USER));
    yield put(filterLocationsError());
    const locations = yield select(selectReadLocations);
    const response = yield call(filterLocations, locations, field, direction, search);
    yield put(filterLocationsSuccess(response));
  } catch (error) {
    logError(error);
    yield put(filterLocationsError(error.message));
  } finally {
    yield put(filterLocationsBusy(false));
  }
}

export function* createLocationSaga(action) {
  const body = action.payload;
  try {
    yield put(createLocationBusy(BUSY_GLOBAL));
    yield put(createLocationError());
    const response = yield call(createLocation, body);
    yield put(createLocationSuccess(response));
    yield call(readLocationsSaga);
  } catch (error) {
    logError(error);
    yield put(createLocationError(error.message));
  } finally {
    yield put(createLocationBusy(false));
  }
}

export function* readLocationSaga(action) {
  const body = action.payload;
  try {
    yield put(readLocationBusy(true));
    yield put(readLocationError());
    const response = yield call(readLocation, body);
    yield put(readLocationSuccess(response));
  } catch (error) {
    logError(error);
    yield put(readLocationError(error.message));
  } finally {
    yield put(readLocationBusy(false));
  }
}

export function* updateLocationSaga(action) {
  const body = action.payload;
  const { id } = body;
  try {
    yield put(updateLocationBusy(BUSY_GLOBAL));
    yield put(updateLocationError());
    const response = yield call(updateLocation, id, body);
    yield put(updateLocationSuccess(response));
    yield call(readLocationsSaga);
  } catch (error) {
    logError(error);
    yield put(updateLocationError(error.message));
  } finally {
    yield put(updateLocationBusy(false));
  }
}

export function* deleteLocationSaga(action) {
  const body = action.payload;
  try {
    yield put(deleteLocationBusy(BUSY_GLOBAL));
    yield put(deleteLocationError());
    const response = yield call(deleteLocation, body);
    yield put(deleteLocationSuccess(response));
    yield call(readLocationsSaga);
  } catch (error) {
    logError(error);
    yield put(deleteLocationError(error.message));
  } finally {
    yield put(deleteLocationBusy(false));
  }
}

export function* queryLocationsSearchSaga(action) {
  const { search, auto } = action.payload ? action.payload : {};
  try {
    yield delay(parseInt(process.env.REACT_APP_DEBOUNCE));
    yield put(queryLocationsSearchBusy(auto ? BUSY_AUTO : BUSY_USER));
    yield put(queryLocationsSearchError());
    const response = yield call(queryLocationsSearch, search);
    yield put(queryLocationsSearchSuccess(response));
  } catch (error) {
    logError(error);
    yield put(queryLocationsSearchError(error.message));
  } finally {
    yield put(queryLocationsSearchBusy(false));
  }
}

export function* readLocationsSearchSaga(action) {
  const body = action.payload;
  try {
    yield put(readLocationsSearchBusy(true));
    yield put(readLocationsSearchError());
    const response = yield call(readLocationsSearch, body);
    yield put(readLocationsSearchSuccess(response));
  } catch (error) {
    logError(error);
    yield put(readLocationsSearchError(error.message));
  } finally {
    yield put(readLocationsSearchBusy(false));
  }
}

export default function* locationsSaga() {
  yield takeLatest(READ_LOCATIONS[REQUEST], readLocationsSaga);
  yield takeLatest(FILTER_LOCATIONS[REQUEST], filterLocationsSaga);
  yield takeEvery(CREATE_LOCATION[REQUEST], createLocationSaga);
  yield takeLatest(READ_LOCATION[REQUEST], readLocationSaga);
  yield takeEvery(UPDATE_LOCATION[REQUEST], updateLocationSaga);
  yield takeEvery(DELETE_LOCATION[REQUEST], deleteLocationSaga);
  yield takeLatest(READ_LOCATIONS_SEARCH[REQUEST], readLocationsSearchSaga);
  yield takeLatest(QUERY_LOCATIONS_SEARCH[REQUEST], queryLocationsSearchSaga);
}
