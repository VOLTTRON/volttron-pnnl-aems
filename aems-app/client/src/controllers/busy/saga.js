import {
  BUSY_GLOBAL,
  MAKE_BUSY,
  busyTokens,
  makeBusyBusy,
  makeBusyError,
  makeBusySuccess,
  selectBusyTokens,
} from "./action";
import {
  call,
  delay,
  put,
  select,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";

import { ActionTypes } from "../util";
import { logError } from "utils/utils";
const { REQUEST, BUSY } = ActionTypes;

const modifyBusyToken = (action, tokens) => {
  const { type, payload } = action;
  if (payload) {
    tokens[type] = payload;
  } else {
    delete tokens[type];
  }
  return tokens;
};

export function* isBusySaga(action) {
  const tokens = yield select(selectBusyTokens);
  yield call(modifyBusyToken, action, tokens);
  yield put(busyTokens(tokens));
}

const isBusyAction = (action) => {
  const types = action.type.split("/");
  return types[types.length - 1] === BUSY;
};

export function* makeBusySaga() {
  try {
    yield put(makeBusyBusy(BUSY_GLOBAL));
    yield put(makeBusyError());
    yield delay(5000);
    yield put(makeBusySuccess("successfully busied"));
  } catch (error) {
    logError(error);
    yield put(makeBusyError(error.message));
  } finally {
    yield put(makeBusyBusy(false));
  }
}

export default function* busySaga() {
  yield takeEvery(isBusyAction, isBusySaga);
  yield takeLatest(MAKE_BUSY[REQUEST], makeBusySaga);
}
