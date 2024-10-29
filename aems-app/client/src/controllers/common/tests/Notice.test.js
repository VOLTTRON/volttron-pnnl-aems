import { reset } from "controllers/action";
import { selectNotice, setNotice } from "controllers/common/action";
import configureStore from "controllers/store";

const reduxStore = configureStore({});

describe("common.setNotice()", () => {
  beforeEach(() => {
    reduxStore.dispatch(reset());
  });

  it("notice action should be dispatched.", () => {
    const payload = {
      viewed: true,
    };
    reduxStore.dispatch(setNotice(payload));
    expect(selectNotice(reduxStore.getState())).toEqual(payload);
  });
});
