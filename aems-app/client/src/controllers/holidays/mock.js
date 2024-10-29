import { SERVICE_ENDPOINT_CREATE_HOLIDAY } from "./api";

const mock = {
  [SERVICE_ENDPOINT_CREATE_HOLIDAY]: {
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
