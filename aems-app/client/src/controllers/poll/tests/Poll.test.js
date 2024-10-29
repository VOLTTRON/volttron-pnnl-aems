import { readUser, readUserPoll } from "controllers/user/action";

import configureStore from "controllers/store";
import { expectSaga } from "redux-saga-test-plan";
import fetchMock from "fetch-mock";
import { isPollSaga } from "controllers/poll/saga";
import { reset } from "controllers/action";

const reduxStore = configureStore({});

describe("poll", () => {
  beforeEach(() => {
    fetchMock.reset();
    reduxStore.dispatch(reset());
  });

  it("poll saga should complete normally.", () => {
    const payload = 200;
    reduxStore.dispatch(readUser());
    return expectSaga(isPollSaga, readUserPoll(payload))
      .withState(reduxStore.getState())
      .put(readUser())
      .silentRun()
      .then(() => {
        expect(fetchMock.done()).toBeTruthy();
      });
  });
});
