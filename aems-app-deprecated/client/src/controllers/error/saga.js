import { ActionTypes, generateAction } from "../util";
import {
  CLEAR_ERROR,
  clearErrorBusy,
  clearErrorError,
  clearErrorSuccess,
  errorTokens,
  selectErrorTokens,
} from "./action";
import { call, put, select, takeEvery } from "redux-saga/effects";
import { assign, get } from "lodash";
import { logError } from "utils/utils";
import { reset } from "../action";

const { REQUEST, ERROR } = ActionTypes;

const modifyErrorToken = (action, tokens) => {
  const { type, payload } = action;
  tokens[type] = assign({}, tokens[type], payload, {
    cleared: !Boolean(payload),
  });
  return tokens;
};

const isUnauthorized = (action) => {
  const { payload } = action;
  return /unauthorized|expired|session is invalid/im.test(get(payload, "error", ""));
};

export function* isErrorSaga(action) {
  const tokens = yield select(selectErrorTokens);
  yield call(modifyErrorToken, action, tokens);
  if (isUnauthorized(action)) {
    yield put(reset());
  }
  yield put(errorTokens(tokens));
}

const isErrorAction = (action) => {
  const types = action.type.split("/");
  return types[types.length - 1] === ERROR;
};

export function* clearErrorSaga(action) {
  const { payload: key } = action;
  if (!key) {
    return;
  }
  const errorAction = generateAction(key);
  try {
    yield put(clearErrorBusy());
    yield put(clearErrorError());
    const tokens = yield select(selectErrorTokens);
    yield call(modifyErrorToken, errorAction(), tokens);
    yield put(clearErrorSuccess("successfully cleared error"));
  } catch (error) {
    logError(error);
    yield put(clearErrorError(error.message));
  } finally {
    yield put(clearErrorBusy(false));
  }
}

export default function* errorSaga() {
  yield takeEvery(isErrorAction, isErrorSaga);
  yield takeEvery(CLEAR_ERROR[REQUEST], clearErrorSaga);
}
