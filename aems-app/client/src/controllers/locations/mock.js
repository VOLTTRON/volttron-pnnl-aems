import { SERVICE_ENDPOINT_CREATE_LOCATION } from "./api";

const mock = {
  [SERVICE_ENDPOINT_CREATE_LOCATION]: {
    payload: {
      label: "foo",
    },
    result: {
      id: 1,
      label: "foo",
    },
  },
};

export default mock;
