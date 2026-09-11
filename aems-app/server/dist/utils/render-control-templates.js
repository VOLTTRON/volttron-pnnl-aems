"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderControlTemplates = renderControlTemplates;
const node_path_1 = require("node:path");
const promises_1 = require("node:fs/promises");
const file_1 = require("./file");
const template_1 = require("./template");
async function renderControlTemplates(control, templatePaths, logger) {
    if (templatePaths.length === 0)
        return {};
    const resolved = templatePaths.map((p) => (0, node_path_1.resolve)(p));
    const existing = [];
    const missing = [];
    for (const path of resolved) {
        if (await (0, promises_1.stat)(path).catch(() => null)) {
            existing.push(path);
        }
        else {
            missing.push(path);
            logger?.warn(`Template path does not exist, skipping: ${path}`);
        }
    }
    if (existing.length === 0) {
        throw new Error(`None of the configured ILC template paths exist: ${missing.join(", ")}. ` +
            `Check SERVICE_SETUP_TEMPLATE_PATHS and that the volttron-setup sidecar has populated the templates directory.`);
    }
    const data = {};
    for (const file of await (0, file_1.getConfigFiles)(existing, ".json", logger)) {
        const key = (0, node_path_1.basename)(file, (0, node_path_1.extname)(file));
        const filename = (0, node_path_1.basename)(file);
        const text = await (0, promises_1.readFile)((0, node_path_1.resolve)(file), "utf-8");
        let template;
        try {
            template = JSON.parse(text);
        }
        catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            throw new Error(`Failed to parse template file "${filename}": ${reason}`);
        }
        try {
            data[key] = (0, template_1.transformTemplate)(template, control);
        }
        catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            throw new Error(`Failed to render template "${filename}": ${reason}`);
        }
    }
    return data;
}
//# sourceMappingURL=render-control-templates.js.map