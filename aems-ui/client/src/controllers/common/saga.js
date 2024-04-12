import {
  LOAD,
  ROUTES,
  doLoadBusy,
  doLoadError,
  doLoadSuccess,
  updateRoutesBusy,
  updateRoutesError,
  updateRoutesSuccess,
} from "./action";
import { call, put, takeEvery, takeLatest } from "redux-saga/effects";

import { ActionTypes } from "../util";
import { buildTree } from "utils/tree";
import { concat } from "lodash";
import { logError } from "utils/utils";
import { readUserSaga } from "controllers/user/saga";
import { routes } from "routes";

const { REQUEST } = ActionTypes;

function createRoutes(result) {
  const base = Object.values(routes.map).map((r) => r.data);
  // todo: add other dynamic routes here and insert into concat below
  // const infoProducts = result?map...
  const all = concat(base)
    .filter((v) => v)
    .sort((a, b) => a.id - b.id);
  return buildTree(all);
}

export function* updateRoutesSaga(action) {
  const { payload } = action;
  try {
    yield put(updateRoutesBusy(true));
    yield put(updateRoutesError());
    const result = yield call(createRoutes, payload);
    yield put(updateRoutesSuccess(result));
  } catch (error) {
    logError(error);
    yield put(updateRoutesError(error.message));
  } finally {
    yield put(updateRoutesBusy(false));
  }
}

// define sagas to load on application start here
const doLoadSagas = [readUserSaga];

export function* doLoadSaga() {
  try {
    yield put(doLoadBusy(true));
    yield put(doLoadError());
    for (const saga of doLoadSagas) {
      yield call(saga);
    }
    yield put(doLoadSuccess(true));
  } catch (error) {
    logError(error);
    yield put(doLoadError(error.message));
  } finally {
    yield put(doLoadBusy(false));
  }
}

export default function* commonSaga() {
  yield takeLatest(LOAD[REQUEST], doLoadSaga);
  yield takeEvery(ROUTES[REQUEST], updateRoutesSaga);
}
