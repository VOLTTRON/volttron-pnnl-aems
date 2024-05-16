import { get, isEmpty, isNil, merge, uniq } from "lodash";

export interface ConfigType<T extends {}> {
  readonly id: keyof T;
  readonly parentId: keyof T;
}

export class Node<T extends {}> {
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

  getAncestors(): Node<T>[] {
    return this.parent ? uniq([this, this.parent?.getAncestors()].flat(2)) : [this];
  }

  getAllDescendants(): Node<T>[] {
    return uniq([this, this.children.map((c) => c.getAllDescendants())].flat(2));
  }

  /**
   * Check if a node is an ancestor.
   */
  isAncestor(node: Node<T>): boolean {
    const id = createId(get(node, ["data", this.tree.config.id]));
    if (id === createId(get(this, ["data", this.tree.config.id]))) {
      return false;
    }
    return this.getAncestors()
      .map((n: Node<T>) => createId(get(n, ["data", this.tree.config.id])))
      .includes(id);
  }

  /**
   * Check if a node is a descendant.
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

export class Tree<T extends {}> {
  readonly root: Node<T>;
  readonly config: ConfigType<T>;
  readonly map: Record<string, Node<T>>;

  constructor(items: T[], config: ConfigType<T>) {
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
 */
interface DefaultConfig {
  id: any;
  parentId: any;
}

export function buildTree<T extends DefaultConfig>(items: T[]): Tree<T>;
export function buildTree<T extends {}>(items: T[], config?: ConfigType<T>): Tree<T> {
  if (items.length === 0) {
    return new Tree<T>([], { id: "id", parentId: "parentId" } as any);
  } else if (!config && Reflect.has(items[0], "id") && Reflect.has(items[0], "parentId")) {
    return new Tree(items, { id: "id" as keyof T, parentId: "parentId" as keyof T });
  } else if (config) {
    return new Tree(items, config);
  } else {
    throw new Error("Invalid configuration");
  }
}
