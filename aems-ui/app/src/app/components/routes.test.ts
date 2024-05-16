import { home, tree } from "./routes";

describe("routes", () => {
  it("should have home available", () => {
    expect(home.data?.id).toEqual("home");
  });

  it("should have home as a root child", () => {
    expect(tree.root.children.includes(home)).toBeTruthy();
  });
});
