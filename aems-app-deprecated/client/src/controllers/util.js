import { isBoolean, set } from "lodash";
import { createSelector } from "reselect";

export var getTimestamp = () => new Date();

/**
 * Override this function within testing to return a static timestamp.
 */
export const timestampGenerator = (generator) => (getTimestamp = generator);

export const ResetType = {
  RESET: "reset",
};
const { RESET } = ResetType;

export const ActionTypes = {
  REQUEST: "request",
  BUSY: "busy",
  SUCCESS: "success",
  UPDATE: "update",
  ERROR: "error",
  POLL: "poll",
};
const { REQUEST, BUSY, SUCCESS, UPDATE, ERROR, POLL } = ActionTypes;

/**
 * Set an error as cleared so that it does not display a toast.
 *
 * @param {Object} payload
 */
export const clearError = (payload) => {
  return set(payload, ["payload", "cleared"], true);
};

/**
 * Get the key used to create this type.
 *
 * @param {String} type
 * @returns {String}
 */
export const getKeyType = (type) => {
  const types = type.split("/");
  if (types.length < 2) {
    return "";
  } else {
    return types[0];
  }
};

/**
 * Get the action type used to create this type.
 *
 * @param {String} type
 * @returns {String}
 */
export const getActionType = (type) => {
  const types = type.split("/");
  if (types.length < 2) {
    return "";
  } else {
    return types[types.length - 1];
  }
};

/**
 * Checks whether this is a reset type.
 *
 * @param {String} key
 * @param {String} type
 * @returns {Boolean}
 */

export const isResetType = (key, type) => {
  switch (type) {
    case RESET:
    case `${key}/${RESET}`:
      return true;
    default:
      return false;
  }
};

/**
 * Checks whether this is an action type of: REQUEST, BUSY, SUCCESS, or ERROR.
 *
 * @param {String} key
 * @param {String} type
 * @returns {Boolean}
 */
export const isActionType = (key, type) => {
  if (getKeyType(type) !== key) {
    return false;
  }
  switch (getActionType(type)) {
    case REQUEST:
    case BUSY:
    case SUCCESS:
    case ERROR:
      return true;
    default:
      return false;
  }
};

/**
 * Checks whether this is an action type of: UPDATE.
 *
 * @param {String} key
 * @param {String} type
 * @returns {Boolean}
 */
export const isUpdateType = (key, type) => {
  if (getKeyType(type) !== key) {
    return false;
  }
  switch (getActionType(type)) {
    case UPDATE:
      return true;
    default:
      return false;
  }
};

/**
 * Create a payload for a successful action result.
 * Pass null to clear the result.
 *
 * @param {*} payload
 * @returns {*}
 */
export const createSuccessPayload = (payload) => {
  if (payload === null) {
    return null;
  } else if (isBoolean(payload)) {
    const timestamp = getTimestamp();
    return {
      timestamp: timestamp,
    };
  } else {
    return payload;
  }
};

/**
 * Create a payload for an update action result.
 * Pass null to clear the result.
 *
 * @param {*} payload
 * @returns {*}
 */
export const createUpdatePayload = (payload) => {
  if (payload === null) {
    return null;
  } else if (isBoolean(payload)) {
    const timestamp = getTimestamp();
    return {
      timestamp: timestamp,
    };
  } else {
    return payload;
  }
};

/**
 * Create a payload for an action that produced an error.
 * Pass null to clear the error.
 *
 * @param {*} payload
 * @returns {*}
 */
export const createErrorPayload = (payload) => {
  if (payload) {
    const timestamp = getTimestamp();
    return {
      timestamp: timestamp,
      error: payload,
    };
  } else {
    return null;
  }
};

/**
 * Create a payload for an action that is busy.
 * Pass null to clear the busy state.
 *
 * @param {*} payload
 * @returns {*}
 */
export const createBusyPayload = (payload) => {
  if (payload) {
    const timestamp = getTimestamp();
    return {
      timestamp: timestamp,
      ...(!isBoolean(payload) && { type: payload }),
    };
  } else {
    return null;
  }
};

/**
 * Generate a single type.
 *
 * @param {String} key
 * @param {String} name
 * @returns {String}
 */
export const generateType = (key, name) => {
  return `${key}/${name}`;
};

/**
 * Generates a map of action types for the specified unique key and name.
 *
 * @param {String} key
 * @param {*} name
 */
export const generateTypes = (key, name) => {
  const obj = {
    key: key,
    [REQUEST]: `${key}/${name}/${REQUEST}`,
    [BUSY]: `${key}/${name}/${BUSY}`,
    [SUCCESS]: `${key}/${name}/${SUCCESS}`,
    [UPDATE]: `${key}/${name}/${UPDATE}`,
    [ERROR]: `${key}/${name}/${ERROR}`,
    [POLL]: `${key}/${name}/${POLL}`,
    [RESET]: `${key}/${RESET}`,
  };
  return obj;
};

/**
 * Create types from the specified action by reverse engineering.
 *
 * @param {} action
 */
export const createTypes = (action) => {
  const { type } = action;
  const types = type.split("/");
  const key = types[0];
  const name = types.slice(1, -1).join("/");
  return generateTypes(key, name);
};

export const createToJSSelector = (input) => {
  return createSelector(input, (value) => (value && value.toJS ? value.toJS() : value));
};

export const generateSelector = (key, type) => {
  return createToJSSelector((state) => (state ? state.getIn([key, ...type.split("/")]) : undefined));
};

/**
 * Generate selectors for the specified types generated using generateTypes().
 *
 * @see this#generateTypes
 * @param {*} types
 * @returns {Array} [SUCCESS, ERROR, BUSY, POLL, REQUEST]
 */
export const generateSelectors = (types) => {
  return [
    generateSelector(types.key, types[SUCCESS]),
    generateSelector(types.key, types[ERROR]),
    generateSelector(types.key, types[BUSY]),
    generateSelector(types.key, types[POLL]),
    generateSelector(types.key, types[REQUEST]),
  ];
};

export const generateAction = (type) => {
  const t = getActionType(type);
  switch (t) {
    case BUSY:
      return (payload) => ({
        type,
        payload: createBusyPayload(payload),
      });
    case ERROR:
      return (payload) => ({
        type,
        payload: createErrorPayload(payload),
      });
    case SUCCESS:
      return (payload) => ({
        type,
        payload: createSuccessPayload(payload),
      });
    case UPDATE:
      return (payload) => ({
        type,
        payload: createUpdatePayload(payload),
      });
    case REQUEST:
    default:
      return (payload) => ({ type, payload });
  }
};

/**
 * Generate actions for the specified types generated using generateTypes().
 *
 * @see this#generateTypes
 * @param {*} types
 * @returns {Array} [REQUEST, SUCCESS, ERROR, BUSY, POLL, UPDATE]
 */
export const generateActions = (types) => {
  return [
    generateAction(types[REQUEST]),
    generateAction(types[SUCCESS]),
    generateAction(types[ERROR]),
    generateAction(types[BUSY]),
    generateAction(types[POLL]),
    generateAction(types[UPDATE]),
  ];
};
