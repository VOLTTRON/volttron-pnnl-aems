import { fromJS } from "immutable";
import { routes } from "routes";
import { isActionType } from "../util";
import {
  key,
  MODE,
  NOTICE,
  RESET,
  PREVIOUS_ROUTE,
  CURRENT_ROUTE,
  MESSAGE,
  CURRENT_MODEL,
  CURRENT_DIALOGUE,
} from "./action";

const initialState = {
  common: { routes: { success: routes } },
};

const reducer = (state = fromJS(initialState), action) => {
  const { type, payload } = action;
  if (isActionType(key, type)) {
    return state.setIn(type.split("/"), fromJS(payload));
  }
  // do not clear on global reset
  // if (isResetType(key, type)) {
  //   return fromJS(initialState);
  // }
  switch (type) {
    case RESET:
      return fromJS(initialState);
    case MODE:
    case NOTICE:
    case PREVIOUS_ROUTE:
    case CURRENT_ROUTE:
    case MESSAGE:
    case CURRENT_MODEL:
    case CURRENT_DIALOGUE:
      return state.setIn(type.split("/"), fromJS(payload));
    default:
      return state;
  }
};

export default reducer;
