import { create, doMocked, isMocked, read, remove, update } from "../api";

import { key } from "./action";
import { parseBoolean } from "utils/utils";

export const SERVICE_ENDPOINT = "users";
export const SERVICE_ENDPOINT_CREATE_USER = `${SERVICE_ENDPOINT}/create`;
export const SERVICE_ENDPOINT_READ_USERS = `${SERVICE_ENDPOINT}/read`;
export const SERVICE_ENDPOINT_READ_USER = `${SERVICE_ENDPOINT}/1/read`;
export const SERVICE_ENDPOINT_UPDATE_USER = `${SERVICE_ENDPOINT}/1/update`;
export const SERVICE_ENDPOINT_DELETE_USER = `${SERVICE_ENDPOINT}/1/delete`;

const isAuthenticate = parseBoolean(process.env.REACT_APP_LOGIN);

export const readUsers = () => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_USERS);
  return read(`${SERVICE_ENDPOINT}`, null, isAuthenticate);
};

export const createUser = (body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_CREATE_USER);
  return create(`${SERVICE_ENDPOINT}`, body, null, isAuthenticate);
};

export const readUser = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_READ_USER);
  return read(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};

export const updateUser = (id, body) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_UPDATE_USER);
  return update(`${SERVICE_ENDPOINT}/${id}`, body, null, isAuthenticate);
};

export const deleteUser = (id) => {
  if (isMocked()) return doMocked(key, SERVICE_ENDPOINT_DELETE_USER);
  return remove(`${SERVICE_ENDPOINT}/${id}`, null, isAuthenticate);
};
