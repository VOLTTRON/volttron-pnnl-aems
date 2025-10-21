declare const ROOT = "__root__";
export type Root = typeof ROOT;
export interface ConfigType<T extends object> {
    readonly id: keyof T;
    readonly parentId: keyof T;
}
export declare class Node<T extends {}> {
    readonly tree: Tree<T, any>;
    readonly data?: T;
    readonly children: Node<T>[];
    parent?: Node<T>;
    constructor(tree: Tree<T, any>, data?: T);
    isRoot(): boolean;
    isLeaf(): boolean;
    isBranch(): boolean;
    getAncestors(): Node<T>[];
    getDescendants(): Node<T>[];
    isAncestor(node: Node<T>): boolean;
    isDescendant(node: Node<T>): boolean;
    [Symbol.iterator](): Generator<Node<T>>;
}
export declare class Tree<T extends {
    [key in C["id" | "parentId"]]: string | number | undefined;
}, C extends ConfigType<T>> {
    readonly root: Node<T>;
    readonly config: ConfigType<T>;
    private readonly map;
    constructor(items: readonly T[], config: C);
    findNode(id: string | number | undefined): Node<T> | undefined;
    [Symbol.iterator](): Generator<Node<T>, void, any>;
}
export interface DefaultType {
    id: string | number | undefined;
    parentId: string | number | undefined;
}
export interface DefaultConfig extends ConfigType<DefaultType> {
}
export interface DefaultNode<T extends {}> extends Node<DefaultType & T> {
}
export interface DefaultTree<T extends {}> extends Tree<DefaultType & T, DefaultConfig> {
}
export declare function buildTree<T extends DefaultType>(items: readonly T[]): DefaultTree<T>;
export declare function buildTree<T extends {
    [key in C["id" | "parentId"]]: string | number | undefined;
}, C extends ConfigType<T>>(items: readonly T[], config: C): Tree<T, C>;
export {};
