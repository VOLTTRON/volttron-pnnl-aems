import fs from "fs";
import path from "path";

jest.dontMock("fs");

describe("saga.rootSaga", () => {
  it("all sagas should be accounted for", () => {
    const expected = fs
      .readdirSync(__dirname, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
    const content = fs.readFileSync(path.join(__dirname, "saga.js"), "utf8");
    const regex = /\b(?!root)(\w+)Saga\(\)/g;
    const sagas = [];
    let match = null;
    while ((match = regex.exec(content))) {
      sagas.push(match[1]);
    }
    expect(new Set(sagas)).toEqual(new Set(expected));
  });
});
