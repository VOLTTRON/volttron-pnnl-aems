import { buildTree } from "./tree";
import { clone } from "lodash";

const ITEMS = [
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
    parentId: undefined,
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
    parentId: undefined,
    name: "root",
  },
];

const throwIfFalsy = <T extends {}>(value: T | null | undefined): T => {
  if (!value) {
    throw new Error("Falsy value");
  } else {
    return value;
  }
};

describe("utils.buildTree()", () => {
  let items: { id: number; parentId: number | undefined; name: string }[] = [];

  beforeEach(() => {
    items = clone(ITEMS);
  });

  it("should return all root items", () => {
    const expected = [3, 10];
    expect(buildTree(items).root.children.map((v) => v.data?.id)).toEqual(expected);
  });

  it("should return all child items", () => {
    const expected = [0, 1];
    expect(
      buildTree(items)
        .findNode(10)
        ?.children.map((v) => v.data?.id)
    ).toEqual(expected);
  });

  it("should return all grandchild items", () => {
    const expected = [2];
    expect(
      buildTree(items)
        .findNode(1)
        ?.children.map((v) => v.data?.id)
    ).toEqual(expected);
  });

  it("should return all great grandchild items", () => {
    const expected = [4, 5];
    expect(
      buildTree(items)
        .findNode(2)
        ?.children.map((v) => v.data?.id)
    ).toEqual(expected);
  });

  it("should not find itself as descendant", () => {
    const tree = buildTree(items);
    expect(tree.findNode(10)?.isDescendant(throwIfFalsy(tree.findNode(10)))).toEqual(false);
  });

  it("should not find orphan as descendant", () => {
    const tree = buildTree(items);
    expect(tree.findNode(10)?.isDescendant(throwIfFalsy(tree.findNode(3)))).toEqual(false);
  });

  it("should find child descendants", () => {
    const tree = buildTree(items);
    expect(tree.findNode(10)?.isDescendant(throwIfFalsy(tree.findNode(0)))).toEqual(true);
    expect(tree.findNode(10)?.isDescendant(throwIfFalsy(tree.findNode(1)))).toEqual(true);
  });

  it("should find grandchild descendants", () => {
    const tree = buildTree(items);
    expect(tree.findNode(10)?.isDescendant(throwIfFalsy(tree.findNode(2)))).toEqual(true);
  });

  it("should find great grandchild descendants", () => {
    const tree = buildTree(items);
    expect(tree.findNode(10)?.isDescendant(throwIfFalsy(tree.findNode(4)))).toEqual(true);
    expect(tree.findNode(10)?.isDescendant(throwIfFalsy(tree.findNode(5)))).toEqual(true);
  });

  it("should find root", () => {
    const tree = buildTree(items);
    const node = tree.findNode(undefined);
    expect(node?.data).toEqual(tree.root.data);
  });

  it("should find root with a custom config", () => {
    const remapped = items.map((v) => ({ ...v, stringId: v.id.toString(), stringParentId: v.parentId?.toString() }));
    const tree = buildTree(remapped, { id: "stringId", parentId: "stringParentId" });
    const node = tree.findNode(undefined);
    expect(node?.data).toEqual(tree.root.data);
  });

  it("root data should be parent item using data without orphans", () => {
    delete items[3];
    const tree = buildTree(items);
    expect(tree.root.data?.name).toEqual("root");
  });

  it("should find root using data without orphans", () => {
    delete items[3];
    const tree = buildTree(items);
    const node = tree.findNode(undefined);
    expect(node?.data).toEqual(tree.root.data);
  });

  it("should find root using data without orphans with a custom config", () => {
    delete items[3];
    const remapped = items.map((v) => ({ ...v, stringId: v.id.toString(), stringParentId: v.parentId?.toString() }));
    const tree = buildTree(remapped, { id: "stringId", parentId: "stringParentId" });
    const node = tree.findNode(undefined);
    expect(node?.data).toEqual(tree.root.data);
  });

  it("should find node 5", () => {
    const tree = buildTree(items);
    const node = tree.findNode(5);
    expect(node?.data).toEqual(items[5]);
  });

  it("should find node 5 with a custom config", () => {
    const remapped = items.map((v) => ({ ...v, stringId: v.id.toString(), stringParentId: v.parentId?.toString() }));
    const tree = buildTree(remapped, { id: "stringId", parentId: "stringParentId" });
    const node = tree.findNode("5");
    expect(node?.data).toEqual(remapped[5]);
  });
});

describe("getAncestors", () => {
  let items: { id: number; parentId: number | undefined; name: string }[] = [];

  beforeEach(() => {
    items = clone(ITEMS);
  });

  it("should return the correct ancestors", () => {
    const tree = buildTree(items);
    const node = throwIfFalsy(tree.findNode(5));
    const ancestors = node.getAncestors().map((v) => v.data);
    expect(ancestors).toEqual(
      [tree.findNode(5), tree.findNode(2), tree.findNode(1), tree.findNode(10)].map((v) => v?.data)
    );
  });
});

describe("isAncestor", () => {
  let items: { id: number; parentId: number | undefined; name: string }[] = [];

  beforeEach(() => {
    items = clone(ITEMS);
  });

  it("should return true if the node is an ancestor", () => {
    const tree = buildTree(items);
    const node = throwIfFalsy(tree.findNode(5));
    const ancestor = throwIfFalsy(tree.findNode(2));

    expect(node.isAncestor(ancestor)).toEqual(true);
  });

  it("should return false if the node is not an ancestor", () => {
    const tree = buildTree(items);
    const node = throwIfFalsy(tree.findNode(5));
    const notAncestor = throwIfFalsy(tree.findNode(0));

    expect(node.isAncestor(notAncestor)).toEqual(false);
  });
});

describe("iterator", () => {
  let items: { id: number; parentId: number | undefined; name: string }[] = [];

  beforeEach(() => {
    items = clone(ITEMS);
  });

  it("should iterate over all nodes", () => {
    const tree = buildTree(items);
    const expected = [undefined, 3, 10, 0, 1, 2, 4, 5];
    const actual = [...tree].map((v) => v.data?.id);
    expect(actual).toEqual(expected);
  });

  it("should iterate over all nodes with a custom config", () => {
    const remapped = items.map((v) => ({ ...v, stringId: v.id.toString(), stringParentId: v.parentId?.toString() }));
    const tree = buildTree(remapped, { id: "stringId", parentId: "stringParentId" });
    const expected = [
      undefined,
      "orphan",
      "root",
      "child 0",
      "child 1",
      "grandchild 0",
      "great grandchild 0",
      "great grandchild 1",
    ];
    const actual = [...tree].map((v) => v.data?.name);
    expect(actual).toEqual(expected);
  });
});