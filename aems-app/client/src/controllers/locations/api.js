import { create, doMocked, isMocked, read, remove, update } from "../api";

import { key } from "./action";
import { parseBoolean } from "utils/utils";

export const SERVICE_ENDPOINT = "locations";
export const SERVICE_ENDPOINT_CREATE_LOCATION = `${SERVICE_ENDPOINT}/create`;
export const SERVICE_ENDPOINT_READ_LOCATIONS = `${SERVICE_ENDPOINT}/read`;
export const SERVICE_ENDPOINT_READ_LOCATION = `${SERVICE_ENDPOINT}/1/read`;
export const SERVICE_ENDPOINT_UPDATE_LOCATION = `${SERVICE_ENDPOINT}/1/update`;
export const SERVICE_ENDPOINT_DELETE_LOCATION = `${SERVICE_ENDPOINT}/1/delete`;
export const SERVICE_ENDPOINT_LOCATIONS_SEARCH = `${SERVICE_ENDPOINT}/search`;

const isAuthenticate = parseBoolean(process.env.REACT_APP_LOGIN);

export const readLocations = () => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_LOCATIONS);
  return read(`${SERVICE_ENDPOINT}`, null, isAuthenticate);
};

export const createLocation = (body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_CREATE_LOCATION);
  return create(`${SERVICE_ENDPOINT}`, body, null, isAuthenticate);
};

export const readLocation = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_LOCATION);
  return read(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};

export const updateLocation = (id, body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_UPDATE_LOCATION);
  return update(`${SERVICE_ENDPOINT}/${id}`, body, null, isAuthenticate);
};

export const deleteLocation = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_DELETE_LOCATION);
  return remove(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};

export const readLocationsSearch = () => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_LOCATIONS_SEARCH);
  return read(`${SERVICE_ENDPOINT}/search`, null, isAuthenticate);
};

export const queryLocationsSearch = (body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_LOCATIONS_SEARCH);
  return create(`${SERVICE_ENDPOINT}/search`, body, null, isAuthenticate);
};
