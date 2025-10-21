"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tree = exports.Node = void 0;
exports.buildTree = buildTree;
const ROOT = "__root__";
class Node {
    constructor(tree, data) {
        this.tree = tree;
        this.data = data;
        this.parent = undefined;
        this.children = [];
    }
    isRoot() {
        return this.parent === undefined;
    }
    isLeaf() {
        return this.children.length === 0;
    }
    isBranch() {
        return !this.isLeaf();
    }
    getAncestors() {
        return this.parent ? [this, ...this.parent.getAncestors()] : [this];
    }
    getDescendants() {
        return [this, ...this.children.map((c) => c.getDescendants())].flat();
    }
    isAncestor(node) {
        const id = node.data?.[this.tree.config.id];
        if (id === this.data?.[this.tree.config.id]) {
            return false;
        }
        return this.getAncestors()
            .map((n) => n.data?.[this.tree.config.id])
            .includes(id);
    }
    isDescendant(node) {
        const id = node.data?.[this.tree.config.id];
        if (id === this.data?.[this.tree.config.id]) {
            return false;
        }
        return this.getDescendants()
            .map((n) => n.data?.[this.tree.config.id])
            .includes(id);
    }
    *[Symbol.iterator]() {
        yield this;
        for (const child of this.children) {
            yield* child[Symbol.iterator]();
        }
    }
}
exports.Node = Node;
class Tree {
    constructor(items, config) {
        const temp = new Node(this);
        this.config = config;
        this.map = items.reduce((p, c) => {
            const id = c[config.id];
            p[id ?? ROOT] = new Node(this, c);
            return p;
        }, {});
        Object.values(this.map).forEach((v) => {
            if (v.data) {
                const parentId = v.data?.[config.parentId];
                const parent = this.map[parentId ?? ROOT];
                if (parent !== undefined) {
                    v.parent = parent;
                    parent.children.push(v);
                }
                else {
                    v.parent = temp;
                    temp.children.push(v);
                }
            }
        });
        this.root = temp.children.length === 1 ? temp.children[0] : temp;
        this.map[ROOT] = this.root;
    }
    findNode(id) {
        return this.map[id ?? ROOT];
    }
    *[Symbol.iterator]() {
        yield* this.root;
    }
}
exports.Tree = Tree;
function buildTree(items, config) {
    if (!config && Reflect.has(items[0], "id") && Reflect.has(items[0], "parentId")) {
        return new Tree(items, { id: "id", parentId: "parentId" });
    }
    else if (config) {
        return new Tree(items, config);
    }
    else {
        throw new Error("Invalid configuration");
    }
}
//# sourceMappingURL=tree.js.map