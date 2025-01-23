import configureStore from "controllers/store";
import fs from "fs";

const reduxStore = configureStore({});

jest.dontMock("fs");

describe("reducer.combineReducers", () => {
  it("all controller reducers should be accounted for", () => {
    const expected = fs
      .readdirSync(__dirname, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
    const reducers = reduxStore.getState().keys();
    expect(new Set(reducers)).toEqual(new Set(expected));
  });
});
