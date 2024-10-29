import { fromJS } from "immutable";
import { isResetType, isActionType } from "../util";
import { ERROR_TOKENS, key } from "./action";
import { set } from "lodash";

const initialState = set({}, ERROR_TOKENS.replace(/\//, "."), {});

const reducer = (state = fromJS(initialState), action) => {
  const { type, payload } = action;
  if (isActionType(key, type)) {
    return state.setIn(type.split("/"), fromJS(payload));
  }
  if (isResetType(key, type)) {
    return fromJS(initialState);
  }
  switch (type) {
    case ERROR_TOKENS:
      return state.setIn(type.split("/"), fromJS(payload));
    default:
      return state;
  }
};

export default reducer;
