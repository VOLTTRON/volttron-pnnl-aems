import { SERVICE_ENDPOINT_CREATE_SETPOINT } from "./api";

const mock = {
  [SERVICE_ENDPOINT_CREATE_SETPOINT]: {
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
