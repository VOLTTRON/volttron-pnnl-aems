"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getObjectKey = getObjectKey;
const node_crypto_1 = require("node:crypto");
function getObjectKey(file) {
    const parts = file.name.split(".");
    const extension = parts.length > 1 ? parts.pop() : "";
    return extension ? `${(0, node_crypto_1.randomUUID)()}.${extension}` : (0, node_crypto_1.randomUUID)();
}
//# sourceMappingURL=file.js.map