import { create, doMocked, isMocked, read, update } from "../api";

import { key } from "./action";
import { parseBoolean } from "utils/utils";

export const SERVICE_ENDPOINT = "user";
export const AUTH_ENDPOINT = "auth";
export const SERVICE_ENDPOINT_READ_USER = `${SERVICE_ENDPOINT}/read`;
export const SERVICE_ENDPOINT_UPDATE_USER = `${SERVICE_ENDPOINT}/`;
export const SERVICE_ENDPOINT_LOGIN = `${AUTH_ENDPOINT}/login`;
export const SERVICE_ENDPOINT_LOGOUT = `${AUTH_ENDPOINT}/logout`;

const isAuthenticate = parseBoolean(process.env.REACT_APP_LOGIN);
let authenticated = false;

export const readUser = () => {
  if (isMocked()) {
    if (authenticated) {
      return doMocked(key, SERVICE_ENDPOINT_READ_USER);
    } else {
      return undefined;
    }
  }
  return read(`${SERVICE_ENDPOINT}`, null, isAuthenticate);
};

export const updateUser = (body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_UPDATE_USER);
  return update(`${SERVICE_ENDPOINT}`, body, null, isAuthenticate);
};

export const login = (body) => {
  if (isMocked()) {
    authenticated = true;
    return doMocked(key, SERVICE_ENDPOINT_LOGIN);
  }
  return create(`${AUTH_ENDPOINT}/local/login`, body);
};

export const logout = () => {
  if (isMocked()) {
    authenticated = false;
    return doMocked(key, SERVICE_ENDPOINT_LOGOUT);
  }
  return create(`${AUTH_ENDPOINT}/logout`, {});
};
