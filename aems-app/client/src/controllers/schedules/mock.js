import { SERVICE_ENDPOINT_CREATE_SCHEDULE } from "./api";

const mock = {
  [SERVICE_ENDPOINT_CREATE_SCHEDULE]: {
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
