import {
  LOGIN_USER,
  LOGOUT_USER,
  READ_USER,
  UPDATE_USER,
  loginUserBusy,
  loginUserError,
  loginUserSuccess,
  logoutUserBusy,
  logoutUserError,
  logoutUserSuccess,
  readUserBusy,
  readUserError,
  readUserSuccess,
  updateUserBusy,
  updateUserError,
  updateUserSuccess,
} from "./action";
import { call, put, takeEvery, takeLatest } from "redux-saga/effects";
import { camelCase, mapKeys, merge, rearg, snakeCase } from "lodash";
import { login, logout, readUser as readUserApi, updateUser } from "./api";

import { ActionTypes } from "../util";
import { BUSY_GLOBAL } from "../busy/action";
import { logError } from "utils/utils";
import { reset } from "../action";

const { REQUEST } = ActionTypes;

const defaultPreferences = (user) => {
  // TODO declare default preferences in second object
  user.preferences = merge({}, {}, user.preferences);
  return user;
};

export const toCamelCase = (response) => mapKeys(response, rearg(camelCase, 1));
export const toSnakeCase = (payload) => mapKeys(payload, rearg(snakeCase, 1));

export function* readUserSaga() {
  try {
    yield put(readUserBusy(true));
    yield put(readUserError());
    let response = yield call(readUserApi);
    response = yield call(defaultPreferences, response);
    yield put(readUserSuccess(response));
  } catch (error) {
    logError(error);
    yield put(readUserError(error.message));
  } finally {
    yield put(readUserBusy(false));
  }
}

export function* updateUserSaga(action) {
  const body = action.payload;
  try {
    yield put(updateUserBusy(BUSY_GLOBAL));
    yield put(updateUserError());
    const response = yield call(updateUser, body);
    yield put(updateUserSuccess(response));
    yield call(readUserSaga);
  } catch (error) {
    logError(error);
    yield put(updateUserError(error.message));
  } finally {
    yield put(updateUserBusy(false));
  }
}

export function* loginSaga(action) {
  const body = action.payload;
  try {
    yield put(loginUserBusy(BUSY_GLOBAL));
    yield put(loginUserError());
    let response = yield call(login, body);
    yield put(loginUserSuccess(response));
    yield call(readUserSaga);
  } catch (error) {
    logError(error);
    yield put(loginUserError(error.message));
  } finally {
    yield put(loginUserBusy(false));
  }
}

export function* logoutSaga() {
  try {
    yield put(logoutUserBusy(BUSY_GLOBAL));
    yield put(logoutUserError());
    yield call(logout);
    yield put(reset());
    yield put(logoutUserSuccess(true));
  } catch (error) {
    logError(error);
    yield put(logoutUserError(error.message));
  } finally {
    yield put(logoutUserBusy(false));
  }
}

export default function* usersSaga() {
  yield takeLatest(READ_USER[REQUEST], readUserSaga);
  yield takeEvery(UPDATE_USER[REQUEST], updateUserSaga);
  yield takeLatest(LOGIN_USER[REQUEST], loginSaga);
  yield takeLatest(LOGOUT_USER[REQUEST], logoutSaga);
}
