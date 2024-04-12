import { buildTree } from "./tree";
import { get } from "lodash";

describe("utils.buildTree()", () => {
  let items = null;

  beforeEach(() => {
    items = JSON.parse(
      JSON.stringify([
        {
          id: 0,
          parentId: 10,
          name: "child 0",
        },
        {
          id: 1,
          parentId: 10,
          name: "child 1",
        },
        {
          id: 2,
          parentId: 1,
          name: "grandchild 0",
        },
        {
          id: 3,
          parentId: null,
          name: "orphan",
        },
        {
          id: 4,
          parentId: 2,
          name: "great grandchild 0",
        },
        {
          id: 5,
          parentId: 2,
          name: "great grandchild 1",
        },
        {
          id: 10,
          parentId: null,
          name: "root",
        },
      ])
    );
  });

  it("should return all root items", () => {
    const expected = [3, 10];
    expect(buildTree(items).root.children.map((v) => get(v, ["data", "id"]))).toEqual(expected);
  });

  it("should return all child items", () => {
    const expected = [0, 1];
    expect(
      buildTree(items)
        .findNode(10)
        .children.map((v) => get(v, ["data", "id"]))
    ).toEqual(expected);
  });

  it("should return all grandchild items", () => {
    const expected = [2];
    expect(
      buildTree(items)
        .findNode(1)
        .children.map((v) => get(v, ["data", "id"]))
    ).toEqual(expected);
  });

  it("should return all great grandchild items", () => {
    const expected = [4, 5];
    expect(
      buildTree(items)
        .findNode(2)
        .children.map((v) => get(v, ["data", "id"]))
    ).toEqual(expected);
  });

  it("should not find itself as descendant", () => {
    const tree = buildTree(items);
    expect(tree.findNode(10).isDescendant(tree.findNode(10))).toEqual(false);
  });

  it("should not find orphan as descendant", () => {
    const tree = buildTree(items);
    expect(tree.findNode(10).isDescendant(tree.findNode(3))).toEqual(false);
  });

  it("should find child descendants", () => {
    const tree = buildTree(items);
    expect(tree.findNode(10).isDescendant(tree.findNode(0))).toEqual(true);
    expect(tree.findNode(10).isDescendant(tree.findNode(1))).toEqual(true);
  });

  it("should find grandchild descendants", () => {
    const tree = buildTree(items);
    expect(tree.findNode(10).isDescendant(tree.findNode(2))).toEqual(true);
  });

  it("should find great grandchild descendants", () => {
    const tree = buildTree(items);
    expect(tree.findNode(10).isDescendant(tree.findNode(4))).toEqual(true);
    expect(tree.findNode(10).isDescendant(tree.findNode(5))).toEqual(true);
  });
});
