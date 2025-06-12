import { reset } from "controllers/action";
import { selectMode, setMode } from "controllers/common/action";
import configureStore from "controllers/store";

const reduxStore = configureStore({});

describe("common.setMode()", () => {
  beforeEach(() => {
    reduxStore.dispatch(reset());
  });

  it("mode action should be dispatched.", () => {
    const payload = {
      mode: "One",
      modes: ["One", "Two"],
    };
    reduxStore.dispatch(setMode(payload));
    expect(selectMode(reduxStore.getState())).toEqual(payload);
  });
});
