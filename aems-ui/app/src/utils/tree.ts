import { get, isEmpty, isNil, merge } from "lodash";

export interface ConfigType {
  readonly id: string;
  readonly parentId: string;
}

export class Node<T> {
  readonly tree: Tree<T>;
  readonly data?: T;
  readonly children: Node<T>[];
  parent?: Node<T>;

  constructor(tree: Tree<T>, data?: T) {
    this.tree = tree;
    this.data = data;
    this.parent = undefined;
    this.children = [];
  }

  isRoot(): boolean {
    return this.parent === null;
  }

  isLeaf(): boolean {
    return isEmpty(this.children);
  }

  isBranch(): boolean {
    return !this.isLeaf();
  }

  getAllDescendants(): Node<T>[] {
    return [this, this.children.map((c) => c.getAllDescendants())].flat(2);
  }

  /**
   * Check if a node is a descendant.
   * @param {Node} node
   * @returns true if node is a descendant
   */
  isDescendant(node: Node<T>): boolean {
    const id = createId(get(node, ["data", this.tree.config.id]));
    if (id === createId(get(this, ["data", this.tree.config.id]))) {
      return false;
    }
    return this.getAllDescendants()
      .map((n: Node<T>) => createId(get(n, ["data", this.tree.config.id])))
      .includes(id);
  }
}

const createId = (id: any) => {
  return isNil(id) ? "" : `${id}`;
};

export class Tree<T> {
  readonly root: Node<T>;
  readonly config: ConfigType;
  readonly map: Record<string, Node<T>>;

  constructor(items: any[], config: ConfigType) {
    this.root = new Node(this);
    this.config = config;
    this.map = items.reduce((p, c) => merge(p, { [createId(c[config.id])]: new Node(this, c) }), {});
    this.map[""] = this.root;
    Object.values(this.map).forEach((v) => {
      if (v.data) {
        const parentId = createId(get(v, ["data", config.parentId]));
        const parent = this.map[parentId];
        if (parent !== undefined) {
          v.parent = parent;
          parent.children.push(v);
        } else {
          v.parent = this.root;
          this.root.children.push(v);
        }
      }
    });
  }

  /**
   * Find a node by id.
   * @param {*} id
   * @returns a node or undefined
   */
  findNode(id: any): Node<T> | undefined {
    return this.map[createId(id)];
  }
}

/**
 * Builds a tree for the list of items.
 *
 * // Build the tree
 * let tree = buildTree(items);
 * // Find a node by its ID.
 * let node = tree.findNode(id);
 * // Get the parent for a node.
 * let parent = node.parent;
 * // Get the tree root node.
 * let root = tree.root;
 * // Get the children for a node.
 * let children = root.children;
 *
 * @param {Array} items
 * @param {*} config defaults to { id: "id", parentId: "parentId" }
 * @returns the tree
 */
export const buildTree = <T>(items: T[], config: ConfigType = { id: "id", parentId: "parentId" }): Tree<T> => {
  return new Tree(items, config);
};
