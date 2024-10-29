import { BUSY_AUTO, BUSY_GLOBAL, BUSY_USER } from "../busy/action";
import {
  CREATE_USER,
  DELETE_USER,
  FILTER_USERS,
  READ_USER,
  READ_USERS,
  UPDATE_USER,
  createUserBusy,
  createUserError,
  createUserSuccess,
  deleteUserBusy,
  deleteUserError,
  deleteUserSuccess,
  filterUsersBusy,
  filterUsersError,
  filterUsersSuccess,
  readUserBusy,
  readUserError,
  readUserSuccess,
  readUsersBusy,
  readUsersError,
  readUsersSuccess,
  selectFilterUsersRequest,
  selectUsers,
  updateUserBusy,
  updateUserError,
  updateUserSuccess,
} from "./action";
import { call, delay, put, select, takeEvery, takeLatest } from "redux-saga/effects";
import { createUser, deleteUser, readUser, readUsers, updateUser } from "./api";

import { ActionTypes } from "../util";
import { filter } from "../../utils/async";
import { logError } from "../../utils/utils";
import { merge } from "lodash";
import moment from "moment";

const { REQUEST } = ActionTypes;

export function* readUsersSaga() {
  try {
    yield put(readUsersBusy(true));
    yield put(readUsersError());
    const response = yield call(readUsers);
    yield put(readUsersSuccess(response));
    const request = yield select(selectFilterUsersRequest);
    yield call(filterUsersSaga, filterUsers(merge(request, { auto: true })));
  } catch (error) {
    logError(error);
    yield put(readUsersError(error.message));
  } finally {
    yield put(readUsersBusy(false));
  }
}

export const filterUsers = (users, field, direction, search) => {
  if (!Array.isArray(users)) {
    return users;
  }
  let result = users.slice();
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
  return filter(result, search, ["name", "email", "role"]);
};

export function* filterUsersSaga(action) {
  const { field, direction, search, auto } = action.payload ? action.payload : {};
  try {
    yield delay(parseInt(process.env.REACT_APP_DEBOUNCE));
    yield put(filterUsersBusy(auto ? BUSY_AUTO : BUSY_USER));
    yield put(filterUsersError());
    const users = yield select(selectUsers);
    const response = yield call(filterUsers, users, field, direction, search);
    yield put(filterUsersSuccess(response));
  } catch (error) {
    logError(error);
    yield put(filterUsersError(error.message));
  } finally {
    yield put(filterUsersBusy(false));
  }
}

export function* createUserSaga(action) {
  const body = action.payload;
  try {
    yield put(createUserBusy(BUSY_GLOBAL));
    yield put(createUserError());
    const response = yield call(createUser, body);
    yield put(createUserSuccess(response));
    yield call(readUsersSaga);
  } catch (error) {
    logError(error);
    yield put(createUserError(error.message));
  } finally {
    yield put(createUserBusy(false));
  }
}

export function* readUserSaga(action) {
  const body = action.payload;
  try {
    yield put(readUserBusy(true));
    yield put(readUserError());
    const response = yield call(readUser, body);
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
    const response = yield call(updateUser, body.id, body);
    yield put(updateUserSuccess(response));
    yield call(readUsersSaga);
  } catch (error) {
    logError(error);
    yield put(updateUserError(error.message));
  } finally {
    yield put(updateUserBusy(false));
  }
}

export function* deleteUserSaga(action) {
  const body = action.payload;
  try {
    yield put(deleteUserBusy(BUSY_GLOBAL));
    yield put(deleteUserError());
    const response = yield call(deleteUser, body);
    yield put(deleteUserSuccess(response));
    yield call(readUsersSaga);
  } catch (error) {
    logError(error);
    yield put(deleteUserError(error.message));
  } finally {
    yield put(deleteUserBusy(false));
  }
}

export default function* usersSaga() {
  yield takeLatest(READ_USERS[REQUEST], readUsersSaga);
  yield takeLatest(FILTER_USERS[REQUEST], filterUsersSaga);
  yield takeEvery(CREATE_USER[REQUEST], createUserSaga);
  yield takeLatest(READ_USER[REQUEST], readUserSaga);
  yield takeEvery(UPDATE_USER[REQUEST], updateUserSaga);
  yield takeEvery(DELETE_USER[REQUEST], deleteUserSaga);
}
