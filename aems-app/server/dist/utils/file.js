"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getObjectKey = getObjectKey;
exports.getConfigFiles = getConfigFiles;
const common_1 = require("@local/common");
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
function getObjectKey(file) {
    const parts = file.name.split(".");
    const extension = parts.length > 1 ? parts.pop() : "";
    return extension ? `${(0, node_crypto_1.randomUUID)()}.${extension}` : (0, node_crypto_1.randomUUID)();
}
async function getConfigFiles(paths, filter, logger) {
    const test = (0, common_1.typeofObject)(filter, (v) => "test" in v)
        ? (file) => filter.test(file)
        : typeof filter === "string"
            ? (file) => file.endsWith(filter)
            : () => true;
    const files = [];
    for (const path of paths) {
        const file = (0, node_path_1.resolve)(process.cwd(), path);
        const dirent = await (0, promises_1.stat)(file);
        if (dirent.isFile()) {
            if (test(file)) {
                files.push(file);
            }
        }
        else if (dirent.isDirectory()) {
            files.push(...(await getConfigFiles(await (0, promises_1.readdir)(file))));
        }
        else {
            logger?.warn(`Skipping non-file and non-directory: ${file}`);
        }
    }
    return files;
}
//# sourceMappingURL=file.js.map