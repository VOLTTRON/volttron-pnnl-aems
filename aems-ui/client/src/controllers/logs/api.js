import { create, doMocked, isMocked, read, remove, update } from "../api";

import { key } from "./action";
import { parseBoolean } from "utils/utils";

export const SERVICE_ENDPOINT = "logs";
export const SERVICE_ENDPOINT_CREATE_LOG = `${SERVICE_ENDPOINT}/create`;
export const SERVICE_ENDPOINT_READ_LOGS = `${SERVICE_ENDPOINT}/read`;
export const SERVICE_ENDPOINT_READ_LOG = `${SERVICE_ENDPOINT}/1/read`;
export const SERVICE_ENDPOINT_UPDATE_LOG = `${SERVICE_ENDPOINT}/1/update`;
export const SERVICE_ENDPOINT_DELETE_LOG = `${SERVICE_ENDPOINT}/1/delete`;

const isAuthenticate = parseBoolean(process.env.REACT_APP_LOGIN);

export const readLogs = (query) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_LOGS);
  return read(`${SERVICE_ENDPOINT}`, query, isAuthenticate);
};

export const createLog = (body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_CREATE_LOG);
  return create(`${SERVICE_ENDPOINT}`, body, null, isAuthenticate);
};

export const readLog = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_LOG);
  return read(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};

export const updateLog = (id, body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_UPDATE_LOG);
  return update(`${SERVICE_ENDPOINT}/${id}`, body, null, isAuthenticate);
};

export const deleteLog = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_DELETE_LOG);
  return remove(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};
