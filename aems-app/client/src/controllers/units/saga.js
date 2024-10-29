import { BUSY_AUTO, BUSY_GLOBAL, BUSY_USER } from "../busy/action";
import {
  CREATE_UNIT,
  DELETE_UNIT,
  FILTER_UNITS,
  READ_UNIT,
  READ_UNITS,
  UPDATE_UNIT,
  createUnitBusy,
  createUnitError,
  createUnitSuccess,
  deleteUnitBusy,
  deleteUnitError,
  deleteUnitSuccess,
  filterUnitsBusy,
  filterUnitsError,
  filterUnitsSuccess,
  readUnitBusy,
  readUnitError,
  readUnitSuccess,
  readUnitsBusy,
  readUnitsError,
  readUnitsSuccess,
  selectFilterUnitsRequest,
  selectReadUnits,
  updateUnitBusy,
  updateUnitError,
  updateUnitSuccess,
} from "./action";
import { call, delay, put, select, takeEvery, takeLatest } from "redux-saga/effects";
import { createHoliday, deleteHoliday } from "controllers/holidays/action";
import { createOccupancy, deleteOccupancy } from "controllers/occupancies/action";
import { createUnit, deleteUnit, readUnit, readUnits, updateUnit } from "./api";
import { merge, omit } from "lodash";

import { ActionTypes } from "../util";
import { filter } from "../../utils/async";
import { logError } from "../../utils/utils";
import moment from "moment";
import { readConfigurationsSaga } from "controllers/configurations/saga";

const { REQUEST } = ActionTypes;

export function* readUnitsSaga() {
  try {
    const data = yield select(selectReadUnits);
    yield put(readUnitsBusy(data ? true : BUSY_GLOBAL));
    yield put(readUnitsError());
    const response = yield call(readUnits);
    yield put(readUnitsSuccess(response));
    const request = yield select(selectFilterUnitsRequest);
    yield call(filterUnitsSaga, filterUnits(merge(request, { auto: true })));
  } catch (error) {
    logError(error);
    yield put(readUnitsError(error.message));
  } finally {
    yield put(readUnitsBusy(false));
  }
}

export const filterUnits = (units, field, direction, search) => {
  if (!Array.isArray(units)) {
    return units;
  }
  let result = units.slice();
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

export function* filterUnitsSaga(action) {
  const { field, direction, search, auto } = action.payload ? action.payload : {};
  try {
    yield delay(parseInt(process.env.REACT_APP_DEBOUNCE));
    yield put(filterUnitsBusy(auto ? BUSY_AUTO : BUSY_USER));
    yield put(filterUnitsError());
    const units = yield select(selectReadUnits);
    const response = yield call(filterUnits, units, field, direction, search);
    yield put(filterUnitsSuccess(response));
  } catch (error) {
    logError(error);
    yield put(filterUnitsError(error.message));
  } finally {
    yield put(filterUnitsBusy(false));
  }
}

export function* createUnitSaga(action) {
  const body = action.payload;
  try {
    yield put(createUnitBusy(BUSY_GLOBAL));
    yield put(createUnitError());
    const response = yield call(createUnit, body);
    yield put(createUnitSuccess(response));
    yield call(readUnitsSaga);
  } catch (error) {
    logError(error);
    yield put(createUnitError(error.message));
  } finally {
    yield put(createUnitBusy(false));
  }
}

export function* readUnitSaga(action) {
  const body = action.payload;
  try {
    yield put(readUnitBusy(true));
    yield put(readUnitError());
    const response = yield call(readUnit, body);
    yield put(readUnitSuccess(response));
  } catch (error) {
    logError(error);
    yield put(readUnitError(error.message));
  } finally {
    yield put(readUnitBusy(false));
  }
}

export function* updateUnitSaga(action) {
  const body = action.payload;
  const { id } = body;
  try {
    yield put(updateUnitBusy(BUSY_GLOBAL));
    yield put(updateUnitError());
    if (body?.configuration?.holidays) {
      for (const holiday of body.configuration.holidays) {
        if (holiday?.type === "Custom") {
          if (holiday.action === "create") {
            yield put(createHoliday(omit(holiday, ["action", "createdAt"])));
          } else if (holiday.action === "delete" && holiday.id !== undefined) {
            yield put(deleteHoliday(holiday.id));
          }
        }
      }
      body.configuration.holidays = body.configuration.holidays.filter(
        (h) => h.type === "Enabled" || h.type === "Disabled"
      );
    }
    if (body?.configuration?.occupancies) {
      for (const occupancy of body.configuration.occupancies) {
        if (occupancy) {
          if (occupancy.action === "create") {
            yield put(createOccupancy(omit(occupancy, ["action", "createdAt"])));
          } else if (occupancy.action === "delete" && occupancy.id !== undefined) {
            yield put(deleteOccupancy(occupancy.id));
          }
        }
      }
      body.configuration.occupancies = body.configuration.occupancies.filter((o) => o.id !== undefined && !o.action);
    }
    const response = yield call(updateUnit, id, body);
    yield put(updateUnitSuccess(response));
    yield call(readUnitsSaga);
    yield call(readConfigurationsSaga);
  } catch (error) {
    logError(error);
    yield put(updateUnitError(error.message));
  } finally {
    yield put(updateUnitBusy(false));
  }
}

export function* deleteUnitSaga(action) {
  const body = action.payload;
  try {
    yield put(deleteUnitBusy(BUSY_GLOBAL));
    yield put(deleteUnitError());
    const response = yield call(deleteUnit, body);
    yield put(deleteUnitSuccess(response));
    yield call(readUnitsSaga);
  } catch (error) {
    logError(error);
    yield put(deleteUnitError(error.message));
  } finally {
    yield put(deleteUnitBusy(false));
  }
}

export default function* unitsSaga() {
  yield takeLatest(READ_UNITS[REQUEST], readUnitsSaga);
  yield takeLatest(FILTER_UNITS[REQUEST], filterUnitsSaga);
  yield takeEvery(CREATE_UNIT[REQUEST], createUnitSaga);
  yield takeLatest(READ_UNIT[REQUEST], readUnitSaga);
  yield takeEvery(UPDATE_UNIT[REQUEST], updateUnitSaga);
  yield takeEvery(DELETE_UNIT[REQUEST], deleteUnitSaga);
}
