import { SERVICE_ENDPOINT_CREATE_CONFIGURATION } from "./api";

const mock = {
  [SERVICE_ENDPOINT_CREATE_CONFIGURATION]: {
    payload: {
      label: "demo",
    },
    result: {
      id: 1,
      label: "demo",
    },
  },
};

export default mock;
