"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderControlTemplates = renderControlTemplates;
const node_path_1 = require("node:path");
const promises_1 = require("node:fs/promises");
const file_1 = require("./file");
const template_1 = require("./template");
async function renderControlTemplates(control, templatePaths, logger) {
    const data = {};
    const paths = templatePaths.map((p) => (0, node_path_1.resolve)(p));
    for (const file of await (0, file_1.getConfigFiles)(paths, ".json", logger)) {
        const key = (0, node_path_1.basename)(file, (0, node_path_1.extname)(file));
        const text = await (0, promises_1.readFile)((0, node_path_1.resolve)(file), "utf-8");
        const template = JSON.parse(text);
        data[key] = (0, template_1.transformTemplate)(template, control);
    }
    return data;
}
//# sourceMappingURL=render-control-templates.js.map