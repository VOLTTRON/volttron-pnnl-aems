import { create, doMocked, isMocked, read, remove, update } from "../api";

import { key } from "./action";
import { parseBoolean } from "utils/utils";

export const SERVICE_ENDPOINT = "configurations";
export const SERVICE_ENDPOINT_CREATE_CONFIGURATION = `${SERVICE_ENDPOINT}/create`;
export const SERVICE_ENDPOINT_READ_CONFIGURATIONS = `${SERVICE_ENDPOINT}/read`;
export const SERVICE_ENDPOINT_READ_CONFIGURATION = `${SERVICE_ENDPOINT}/1/read`;
export const SERVICE_ENDPOINT_UPDATE_CONFIGURATION = `${SERVICE_ENDPOINT}/1/update`;
export const SERVICE_ENDPOINT_DELETE_CONFIGURATION = `${SERVICE_ENDPOINT}/1/delete`;

const isAuthenticate = parseBoolean(process.env.REACT_APP_LOGIN);

export const readConfigurations = () => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_CONFIGURATIONS);
  return read(`${SERVICE_ENDPOINT}`, null, isAuthenticate);
};

export const createConfiguration = (body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_CREATE_CONFIGURATION);
  return create(`${SERVICE_ENDPOINT}`, body, null, isAuthenticate);
};

export const readConfiguration = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_CONFIGURATION);
  return read(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};

export const updateConfiguration = (id, body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_UPDATE_CONFIGURATION);
  return update(`${SERVICE_ENDPOINT}/${id}`, body, null, isAuthenticate);
};

export const deleteConfiguration = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_DELETE_CONFIGURATION);
  return remove(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};
