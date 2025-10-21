import { SERVICE_ENDPOINT_CREATE_CONTROL } from "./api";

const mock = {
  [SERVICE_ENDPOINT_CREATE_CONTROL]: {
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
