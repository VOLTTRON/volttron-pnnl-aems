import { key as busyKey } from "./busy/action";
import busyReducer from "./busy/reducer";
import { combineReducers } from "redux-immutable";
import { key as commonKey } from "./common/action";
import commonReducer from "./common/reducer";
import { key as configurationsKey } from "./configurations/action";
import configurationsReducer from "./configurations/reducer";
import { key as controlsKey } from "./controls/action";
import controlsReducer from "./controls/reducer";
import { key as errorKey } from "./error/action";
import errorReducer from "./error/reducer";
import { key as holidaysKey } from "./holidays/action";
import holidaysReducer from "./holidays/reducer";
import { key as logsKey } from "./logs/action";
import logsReducer from "./logs/reducer";
import { key as occupanciesKey } from "./occupancies/action";
import occupanciesReducer from "./occupancies/reducer";
import { key as pollKey } from "./poll/action";
import pollReducer from "./poll/reducer";
import { key as schedulesKey } from "./schedules/action";
import schedulesReducer from "./schedules/reducer";
import { key as setpointsKey } from "./setpoints/action";
import setpointsReducer from "./setpoints/reducer";
import { key as unitsKey } from "./units/action";
import unitsReducer from "./units/reducer";
import { key as userKey } from "./user/action";
import userReducer from "./user/reducer";
import { key as usersKey } from "./users/action";
import usersReducer from "./users/reducer";
import { key as locationsKey } from "./locations/action";
import locationsReducer from "./locations/reducer";

export default combineReducers({
  [busyKey]: busyReducer,
  [commonKey]: commonReducer,
  [errorKey]: errorReducer,
  [pollKey]: pollReducer,
  [userKey]: userReducer,
  [usersKey]: usersReducer,
  [unitsKey]: unitsReducer,
  [configurationsKey]: configurationsReducer,
  [schedulesKey]: schedulesReducer,
  [setpointsKey]: setpointsReducer,
  [logsKey]: logsReducer,
  [occupanciesKey]: occupanciesReducer,
  [holidaysKey]: holidaysReducer,
  [controlsKey]: controlsReducer,
  [locationsKey]: locationsReducer,
});
