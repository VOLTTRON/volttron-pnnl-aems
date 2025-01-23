import { create, doMocked, isMocked, read, remove, update } from "../api";

import { key } from "./action";
import { parseBoolean } from "utils/utils";

export const SERVICE_ENDPOINT = "units";
export const SERVICE_ENDPOINT_CREATE_UNIT = `${SERVICE_ENDPOINT}/create`;
export const SERVICE_ENDPOINT_READ_UNITS = `${SERVICE_ENDPOINT}/read`;
export const SERVICE_ENDPOINT_READ_UNIT = `${SERVICE_ENDPOINT}/1/read`;
export const SERVICE_ENDPOINT_UPDATE_UNIT = `${SERVICE_ENDPOINT}/1/update`;
export const SERVICE_ENDPOINT_DELETE_UNIT = `${SERVICE_ENDPOINT}/1/delete`;

const isAuthenticate = parseBoolean(process.env.REACT_APP_LOGIN);

export const readUnits = () => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_UNITS);
  return read(`${SERVICE_ENDPOINT}`, null, isAuthenticate);
};

export const createUnit = (body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_CREATE_UNIT);
  return create(`${SERVICE_ENDPOINT}`, body, null, isAuthenticate);
};

export const readUnit = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_UNIT);
  return read(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};

export const updateUnit = (id, body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_UPDATE_UNIT);
  return update(`${SERVICE_ENDPOINT}/${id}`, body, null, isAuthenticate);
};

export const deleteUnit = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_DELETE_UNIT);
  return remove(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};
