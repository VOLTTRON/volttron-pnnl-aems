import { fromJS } from "immutable";
import { isResetType, isActionType } from "../util";
import { key } from "./action";

const initialState = {};

const reducer = (state = fromJS(initialState), action) => {
  const { type, payload } = action;
  if (isActionType(key, type)) {
    return state.setIn(type.split("/"), fromJS(payload));
  }
  if (isResetType(key, type)) {
    return fromJS(initialState);
  }
  switch (type) {
    // add non action type reducers here
    default:
      return state;
  }
};

export default reducer;
