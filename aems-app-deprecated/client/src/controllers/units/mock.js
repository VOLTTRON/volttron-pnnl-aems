import { SERVICE_ENDPOINT_CREATE_UNIT } from "./api";

const mock = {
  [SERVICE_ENDPOINT_CREATE_UNIT]: {
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
