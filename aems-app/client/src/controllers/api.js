import { get, isEmpty, isUndefined, merge } from "lodash";

export const SERVICE_URL = process.env.REACT_APP_API_URL;

export const setAuthorization = (token) => {
  if (token) {
    localStorage.setItem("authorization", token);
  } else {
    localStorage.clear();
  }
};

export const getAuthorization = () => {
  const token = localStorage.getItem("authorization");
  return `${token ? token : "invalid"}`;
};

export const createQuery = (params) => {
  return Object.keys(params)
    .map((key) => key + "=" + params[key])
    .join("&");
};

const validateResponse = async (response) => {
  switch (response.status) {
    case 0:
    case 302:
      throw Error("Session is invalid.");
    default:
      if (!response.ok) {
        let message = response.statusText;
        let result = null;
        try {
          result = await response.text();
          result = JSON.parse(result);
          message = get(result, "Message", isEmpty(result) ? message : result.error);
        } catch {
          // duck exception
        }
        throw Error(message);
      }
      return response;
  }
};

const handleResponse = async (response) => {
  let result = null;
  try {
    result = await response.text();
    result = JSON.parse(result);
  } catch {
    // purposely ducked catch
  }

  return result;
};

const handleError = (error) => {
  throw error;
};

const createTarget = (endpoint, params) => {
  let target = `${SERVICE_URL}/${endpoint}`;
  if (params) {
    const query = createQuery(params);
    target = `${target}?${query}`;
  }
  return target;
};

const defaultOptions = (authenticated) => {
  return {
    // mode: "cors", // no-cors, *cors, same-origin
    // cache: "default", // *default, no-cache, reload, force-cache, only-if-cached
    redirect: "manual", // manual, *follow, error
    // referrerPolicy: "client", // no-referrer, *client
    ...(authenticated && { credentials: "same-origin" }), // include, *same-origin, omit
    headers: {
      ...(authenticated && { Authorization: `Token ${getAuthorization()}` }),
    },
  };
};

/**
 * Determine if this endpoint should return mocked data.
 * Pass in true if the server endpoint is not complete and should always return mocked data.
 *
 * @param {Boolean} mocked
 */
export const isMocked = (mocked) => {
  return (
    (process.env.NODE_ENV !== "test" && mocked) ||
    (process.env.NODE_ENV === "development" && /^[/s]*true|yes|t|y[/s]*$/i.test(process.env.REACT_APP_MOCK))
  );
};

/**
 * Gets mocked data from the mock file using the supplied key as part of the path and endpoint as the field.
 *
 * @param {String} key
 * @param {String} endpoint
 */
export const doMocked = async (key, endpoint) => {
  return import(`./${key}/mock`).then((mock) => {
    if (isUndefined(get(mock, ["default", endpoint]))) {
      return null;
    }
    const data = mock.default[endpoint];
    return data.result;
  });
};

/**
 * Read (GET) from a service endpoint URL.
 *
 * @param {String} endpoint
 * @param {*} query
 * @param {Boolean} authenticated
 */
export const read = async (endpoint, query = null, authenticated = false) => {
  const options = merge({}, defaultOptions(authenticated), {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
  });
  let target = createTarget(endpoint, query);
  return fetch(target, options).then(validateResponse).then(handleResponse).catch(handleError);
};

/**
 * Update (PUT) on service endpoint URL.
 *
 * @param {String} endpoint
 * @param {*} body
 * @param {*} query
 * @param {Boolean} authenticated
 */
export const update = async (endpoint, body, query = null, authenticated = false) => {
  const options = merge({}, defaultOptions(authenticated), {
    method: "PUT",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : "",
  });
  let target = createTarget(endpoint, query);
  return fetch(target, options).then(validateResponse).then(handleResponse).catch(handleError);
};

/**
 * Create (POST) at a service endpoint URL.
 *
 * @param {String} endpoint
 * @param {*} body
 * @param {*} query
 * @param {Boolean} authenticated
 */
export const create = async (endpoint, body, query = null, authenticated = false, form = false) => {
  const options = merge({}, defaultOptions(authenticated), {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": form ? "application/x-www-form-urlencoded" : "application/json",
    },
    body: body ? (form ? encodeURI(createQuery(body)) : JSON.stringify(body)) : "",
  });
  let target = createTarget(endpoint, query);
  return fetch(target, options).then(validateResponse).then(handleResponse).catch(handleError);
};

/**
 * Remove (DELETE) from a service endpoint URL.
 *
 * @param {String} endpoint
 * @param {*} query
 * @param {Boolean} authenticated
 */
export const remove = async (endpoint, query = null, authenticated = false) => {
  const options = merge({}, defaultOptions(authenticated), {
    method: "DELETE",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
  });
  let target = createTarget(endpoint, query);
  return fetch(target, options).then(validateResponse).then(handleResponse).catch(handleError);
};

/**
 * Upload (POST) to a service endpoint URL.
 *
 * @param {String} endpoint
 * @param {*} file
 * @param {*} query
 * @param {Boolean} authenticated
 */
export const upload = async (endpoint, file, query = null, authenticated = false) => {
  const data = new FormData();
  data.append("file", file.files[0]);
  const options = merge({}, defaultOptions(authenticated), {
    method: "POST",
    headers: {
      // setting the header here will cause the multipart post upload to fail
      // 'Content-Type': '?',
      Accept: "application/json",
    },
    body: data,
  });
  let target = createTarget(endpoint, query);
  return fetch(target, options).then(validateResponse).then(handleResponse).catch(handleError);
};
