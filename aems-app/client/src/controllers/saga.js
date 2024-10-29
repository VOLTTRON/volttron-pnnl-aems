import { all } from "redux-saga/effects";
import busySaga from "./busy/saga";
import commonSaga from "./common/saga";
import configurationsSaga from "./configurations/saga";
import controlsSaga from "./controls/saga";
import errorSaga from "./error/saga";
import holidaysSaga from "./holidays/saga";
import logsSaga from "./logs/saga";
import occupanciesSaga from "./occupancies/saga";
import pollSaga from "./poll/saga";
import schedulesSaga from "./schedules/saga";
import setpointsSaga from "./setpoints/saga";
import unitsSaga from "./units/saga";
import userSaga from "./user/saga";
import usersSaga from "./users/saga";
import locationsSaga from "./locations/saga";

export default function* rootSaga() {
  yield all([
    busySaga(),
    commonSaga(),
    errorSaga(),
    pollSaga(),
    userSaga(),
    usersSaga(),
    unitsSaga(),
    configurationsSaga(),
    schedulesSaga(),
    setpointsSaga(),
    logsSaga(),
    occupanciesSaga(),
    holidaysSaga(),
    controlsSaga(),
    locationsSaga(),
  ]);
}
