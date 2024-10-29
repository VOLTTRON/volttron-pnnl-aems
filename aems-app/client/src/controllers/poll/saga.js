import { call, delay, put, race, select, take, takeEvery } from "redux-saga/effects";
import { ActionTypes, createTypes, generateActions, generateSelectors } from "../util";
const { POLL } = ActionTypes;

export function* isPollSaga(action) {
  const { payload: ms } = action;
  const types = createTypes(action);
  const [requestAction, , errorAction, , pollAction] = generateActions(types);
  const [, selectError, selectBusy, , selectRequest] = generateSelectors(types);
  while (true) {
    try {
      yield delay(ms);
      const busyPayload = yield select(selectBusy);
      if (!busyPayload) {
        const errorPayload = yield select(selectError);
        if (!errorPayload) {
          const requestPayload = yield select(selectRequest);
          yield put(requestAction(requestPayload));
        }
      }
    } catch (err) {
      yield put(errorAction(err && err.message));
      yield put(pollAction());
    }
  }
}

const isPollStartAction = (action) => {
  const { type, payload } = action;
  const types = type.split("/");
  if (types[types.length - 1] === POLL && payload > 0) {
    return action;
  }
};

const isPollStopAction = (created) => (action) => {
  const { type, payload } = action;
  return created.type === type && (!payload || payload === 0);
};

export function* pollWatcherSaga(action) {
  yield race([call(isPollSaga, action), take(isPollStopAction(action))]);
}

export default function* pollSaga() {
  yield takeEvery(isPollStartAction, pollWatcherSaga);
}
