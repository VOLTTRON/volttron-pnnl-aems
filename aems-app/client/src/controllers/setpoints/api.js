import { create, doMocked, isMocked, read, remove, update } from "../api";

import { key } from "./action";
import { parseBoolean } from "utils/utils";

export const SERVICE_ENDPOINT = "setpoints";
export const SERVICE_ENDPOINT_CREATE_SETPOINT = `${SERVICE_ENDPOINT}/create`;
export const SERVICE_ENDPOINT_READ_SETPOINTS = `${SERVICE_ENDPOINT}/read`;
export const SERVICE_ENDPOINT_READ_SETPOINT = `${SERVICE_ENDPOINT}/1/read`;
export const SERVICE_ENDPOINT_UPDATE_SETPOINT = `${SERVICE_ENDPOINT}/1/update`;
export const SERVICE_ENDPOINT_DELETE_SETPOINT = `${SERVICE_ENDPOINT}/1/delete`;

const isAuthenticate = parseBoolean(process.env.REACT_APP_LOGIN);

export const readSetpoints = () => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_SETPOINTS);
  return read(`${SERVICE_ENDPOINT}`, null, isAuthenticate);
};

export const createSetpoint = (body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_CREATE_SETPOINT);
  return create(`${SERVICE_ENDPOINT}`, body, null, isAuthenticate);
};

export const readSetpoint = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_SETPOINT);
  return read(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};

export const updateSetpoint = (id, body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_UPDATE_SETPOINT);
  return update(`${SERVICE_ENDPOINT}/${id}`, body, null, isAuthenticate);
};

export const deleteSetpoint = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_DELETE_SETPOINT);
  return remove(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};
