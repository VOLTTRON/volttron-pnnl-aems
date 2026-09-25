"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSecret = readSecret;
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger("readSecret");
function readSecret(secretName, defaultValue = "") {
    const envValue = process.env[secretName];
    if (envValue) {
        return envValue;
    }
    if (process.env.NODE_ENV === "production") {
        logger.warn(`No secret found for ${secretName}${defaultValue ? ", using default value" : " and no default provided"}`);
    }
    return defaultValue;
}
//# sourceMappingURL=readSecret.js.map