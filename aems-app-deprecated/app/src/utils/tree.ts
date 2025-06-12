const ROOT = "__root__";
export type Root = typeof ROOT;

export interface ConfigType<T extends {}> {
  readonly id: keyof T;
  readonly parentId: keyof T;
}

export class Node<T extends {}> {
  readonly tree: Tree<T, any>;
  readonly data?: T;
  readonly children: Node<T>[];
  parent?: Node<T>;

  constructor(tree: Tree<T, any>, data?: T) {
    this.tree = tree;
    this.data = data;
    this.parent = undefined;
    this.children = [];
  }

  isRoot(): boolean {
    return this.parent === undefined;
  }

  isLeaf(): boolean {
    return this.children.length === 0;
  }

  isBranch(): boolean {
    return !this.isLeaf();
  }

  getAncestors(): Node<T>[] {
    return this.parent ? [this, ...this.parent.getAncestors()] : [this];
  }

  getDescendants(): Node<T>[] {
    return [this, ...this.children.map((c) => c.getDescendants())].flat();
  }

  /**
   * Check if a node is an ancestor.
   */
  isAncestor(node: Node<T>): boolean {
    const id = node.data?.[this.tree.config.id];
    if (id === this.data?.[this.tree.config.id]) {
      return false;
    }
    return this.getAncestors()
      .map((n: Node<T>) => n.data?.[this.tree.config.id])
      .includes(id);
  }

  /**
   * Check if a node is a descendant.
   */
  isDescendant(node: Node<T>): boolean {
    const id = node.data?.[this.tree.config.id];
    if (id === this.data?.[this.tree.config.id]) {
      return false;
    }
    return this.getDescendants()
      .map((n: Node<T>) => n.data?.[this.tree.config.id])
      .includes(id);
  }

  *[Symbol.iterator](): Generator<Node<T>> {
    yield this;
    for (const child of this.children) {
      yield* child[Symbol.iterator]();
    }
  }
}

export class Tree<
  T extends { [key in C["id" | "parentId"]]: string | number | symbol | undefined },
  C extends ConfigType<T>
> {
  readonly root: Node<T>;
  readonly config: ConfigType<T>;
  private readonly map: Record<any, Node<T>>;

  constructor(items: readonly T[], config: C) {
    const temp = new Node(this);
    this.config = config;
    this.map = items.reduce((p, c) => {
      const id = c[config.id];
      p[id ?? ROOT] = new Node(this, c);
      return p;
    }, {} as Record<any, Node<T>>);
    Object.values(this.map).forEach((v) => {
      if (v.data) {
        const parentId = v.data?.[config.parentId];
        const parent = this.map[parentId ?? ROOT];
        if (parent !== undefined) {
          v.parent = parent;
          parent.children.push(v);
        } else {
          v.parent = temp;
          temp.children.push(v);
        }
      }
    });
    this.root = temp.children.length === 1 ? temp.children[0] : temp;
    this.map[ROOT] = this.root;
  }

  /**
   * Find a node by id.
   * @param {*} id
   * @returns a node or undefined
   */
  findNode(id: any): Node<T> | undefined {
    return this.map[id ?? ROOT];
  }

  *[Symbol.iterator]() {
    yield* this.root;
  }
}

export interface DefaultType {
  id: string | number | symbol | undefined;
  parentId: string | number | symbol | undefined;
}

export interface DefaultConfig extends ConfigType<DefaultType> {}

export interface DefaultNode<T extends {}> extends Node<DefaultType & T> {}

export interface DefaultTree<T extends {}> extends Tree<DefaultType & T, DefaultConfig> {}

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
export function buildTree<T extends DefaultType>(items: readonly T[]): DefaultTree<T>;
export function buildTree<
  T extends { [key in C["id" | "parentId"]]: string | number | symbol | undefined },
  C extends ConfigType<T>
>(items: readonly T[], config: C): Tree<T, C>;
export function buildTree<
  T extends { [key in C["id" | "parentId"]]: string | number | symbol | undefined },
  C extends ConfigType<T>
>(items: readonly T[], config?: C): Tree<T, C> {
  if (items.length === 0) {
    return new Tree<T, C>([], { id: "id", parentId: "parentId" } as any);
  } else if (!config && Reflect.has(items[0], "id") && Reflect.has(items[0], "parentId")) {
    return new Tree(items, { id: "id" as keyof T, parentId: "parentId" as keyof T });
  } else if (config) {
    return new Tree(items, config);
  } else {
    throw new Error("Invalid configuration");
  }
}
