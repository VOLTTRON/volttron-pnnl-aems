import { create, doMocked, isMocked, read, remove, update } from "../api";

import { key } from "./action";
import { parseBoolean } from "utils/utils";

export const SERVICE_ENDPOINT = "holidays";
export const SERVICE_ENDPOINT_CREATE_HOLIDAY = `${SERVICE_ENDPOINT}/create`;
export const SERVICE_ENDPOINT_READ_HOLIDAYS = `${SERVICE_ENDPOINT}/read`;
export const SERVICE_ENDPOINT_READ_HOLIDAY = `${SERVICE_ENDPOINT}/1/read`;
export const SERVICE_ENDPOINT_UPDATE_HOLIDAY = `${SERVICE_ENDPOINT}/1/update`;
export const SERVICE_ENDPOINT_DELETE_HOLIDAY = `${SERVICE_ENDPOINT}/1/delete`;

const isAuthenticate = parseBoolean(process.env.REACT_APP_LOGIN);

export const readHolidays = () => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_HOLIDAYS);
  return read(`${SERVICE_ENDPOINT}`, null, isAuthenticate);
};

export const createHoliday = (body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_CREATE_HOLIDAY);
  return create(`${SERVICE_ENDPOINT}`, body, null, isAuthenticate);
};

export const readHoliday = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_HOLIDAY);
  return read(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};

export const updateHoliday = (id, body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_UPDATE_HOLIDAY);
  return update(`${SERVICE_ENDPOINT}/${id}`, body, null, isAuthenticate);
};

export const deleteHoliday = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_DELETE_HOLIDAY);
  return remove(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};
