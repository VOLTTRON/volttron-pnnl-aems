import { create, doMocked, isMocked, read, remove, update } from "../api";

import { key } from "./action";
import { parseBoolean } from "utils/utils";

export const SERVICE_ENDPOINT = "occupancies";
export const SERVICE_ENDPOINT_CREATE_OCCUPANCY = `${SERVICE_ENDPOINT}/create`;
export const SERVICE_ENDPOINT_READ_OCCUPANCIES = `${SERVICE_ENDPOINT}/read`;
export const SERVICE_ENDPOINT_READ_OCCUPANCY = `${SERVICE_ENDPOINT}/1/read`;
export const SERVICE_ENDPOINT_UPDATE_OCCUPANCY = `${SERVICE_ENDPOINT}/1/update`;
export const SERVICE_ENDPOINT_DELETE_OCCUPANCY = `${SERVICE_ENDPOINT}/1/delete`;

const isAuthenticate = parseBoolean(process.env.REACT_APP_LOGIN);

export const readOccupancies = () => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_OCCUPANCIES);
  return read(`${SERVICE_ENDPOINT}`, null, isAuthenticate);
};

export const createOccupancy = (body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_CREATE_OCCUPANCY);
  return create(`${SERVICE_ENDPOINT}`, body, null, isAuthenticate);
};

export const readOccupancy = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_OCCUPANCY);
  return read(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};

export const updateOccupancy = (id, body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_UPDATE_OCCUPANCY);
  return update(`${SERVICE_ENDPOINT}/${id}`, body, null, isAuthenticate);
};

export const deleteOccupancy = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_DELETE_OCCUPANCY);
  return remove(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};
