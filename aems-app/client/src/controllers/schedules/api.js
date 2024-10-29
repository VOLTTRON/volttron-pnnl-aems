import { create, doMocked, isMocked, read, remove, update } from "../api";

import { key } from "./action";
import { parseBoolean } from "utils/utils";

export const SERVICE_ENDPOINT = "schedules";
export const SERVICE_ENDPOINT_CREATE_SCHEDULE = `${SERVICE_ENDPOINT}/create`;
export const SERVICE_ENDPOINT_READ_SCHEDULES = `${SERVICE_ENDPOINT}/read`;
export const SERVICE_ENDPOINT_READ_SCHEDULE = `${SERVICE_ENDPOINT}/1/read`;
export const SERVICE_ENDPOINT_UPDATE_SCHEDULE = `${SERVICE_ENDPOINT}/1/update`;
export const SERVICE_ENDPOINT_DELETE_SCHEDULE = `${SERVICE_ENDPOINT}/1/delete`;

const isAuthenticate = parseBoolean(process.env.REACT_APP_LOGIN);

export const readSchedules = () => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_SCHEDULES);
  return read(`${SERVICE_ENDPOINT}`, null, isAuthenticate);
};

export const createSchedule = (body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_CREATE_SCHEDULE);
  return create(`${SERVICE_ENDPOINT}`, body, null, isAuthenticate);
};

export const readSchedule = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_SCHEDULE);
  return read(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};

export const updateSchedule = (id, body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_UPDATE_SCHEDULE);
  return update(`${SERVICE_ENDPOINT}/${id}`, body, null, isAuthenticate);
};

export const deleteSchedule = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_DELETE_SCHEDULE);
  return remove(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};
