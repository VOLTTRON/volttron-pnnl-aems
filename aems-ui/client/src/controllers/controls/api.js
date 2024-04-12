import { create, doMocked, isMocked, read, remove, update } from "../api";

import { key } from "./action";
import { parseBoolean } from "utils/utils";

export const SERVICE_ENDPOINT = "controls";
export const SERVICE_ENDPOINT_CREATE_CONTROL = `${SERVICE_ENDPOINT}/create`;
export const SERVICE_ENDPOINT_READ_CONTROLS = `${SERVICE_ENDPOINT}/read`;
export const SERVICE_ENDPOINT_READ_CONTROL = `${SERVICE_ENDPOINT}/1/read`;
export const SERVICE_ENDPOINT_UPDATE_CONTROL = `${SERVICE_ENDPOINT}/1/update`;
export const SERVICE_ENDPOINT_DELETE_CONTROL = `${SERVICE_ENDPOINT}/1/delete`;

const isAuthenticate = parseBoolean(process.env.REACT_APP_LOGIN);

export const readControls = () => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_CONTROLS);
  return read(`${SERVICE_ENDPOINT}`, null, isAuthenticate);
};

export const createControl = (body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_CREATE_CONTROL);
  return create(`${SERVICE_ENDPOINT}`, body, null, isAuthenticate);
};

export const readControl = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_CONTROL);
  return read(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};

export const updateControl = (id, body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_UPDATE_CONTROL);
  return update(`${SERVICE_ENDPOINT}/${id}`, body, null, isAuthenticate);
};

export const deleteControl = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_DELETE_CONTROL);
  return remove(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};
