import { SERVICE_ENDPOINT_LOGIN, SERVICE_ENDPOINT_READ_USER, SERVICE_ENDPOINT_UPDATE_USER } from "./api";

const mock = {
  [SERVICE_ENDPOINT_LOGIN]: {
    payload: {
      email: "demo@pnnl.gov",
      password: "password",
    },
    result: { email: "demo@pnnl.gov", password: "password" },
  },
  [SERVICE_ENDPOINT_READ_USER]: {
    payload: null,
    result: {
      id: 1,
      email: "demo@pnnl.gov",
      scope: "user",
      preferences: {},
    },
  },
  [SERVICE_ENDPOINT_UPDATE_USER]: {
    payload: {
      email: "demo@pnnl.gov",
      password: "password",
      preferences: {},
    },
    result: {
      id: 1,
      email: "demo@pnnl.gov",
      scope: "user",
      preferences: {},
    },
  },
};

export default mock;
