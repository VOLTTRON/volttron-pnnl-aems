import { SERVICE_ENDPOINT_CREATE_OCCUPANCY } from "./api";

const mock = {
  [SERVICE_ENDPOINT_CREATE_OCCUPANCY]: {
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
