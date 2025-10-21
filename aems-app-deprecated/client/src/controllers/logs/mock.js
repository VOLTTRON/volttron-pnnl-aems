import { SERVICE_ENDPOINT_CREATE_LOG } from "./api";

const mock = {
  [SERVICE_ENDPOINT_CREATE_LOG]: {
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
