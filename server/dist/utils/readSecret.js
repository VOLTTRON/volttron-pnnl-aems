"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSecret = readSecret;
const fs_1 = require("fs");
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger("readSecret");
function readSecret(secretName, defaultValue = "") {
    const dockerSecretPath = `/run/secrets/${secretName.toLowerCase()}`;
    try {
        const secretValue = (0, fs_1.readFileSync)(dockerSecretPath, "utf8").trim();
        if (secretValue) {
            logger.log(`Successfully read secret from Docker secret: ${secretName}`);
            return secretValue;
        }
    }
    catch (error) {
        logger.warn(`Secret should be specified for production environment: ${secretName}. Attempted to read from ${dockerSecretPath} but failed: ${error.message || String(error)}`);
    }
    const fileEnvVar = `${secretName}_FILE`;
    const secretFilePath = process.env[fileEnvVar];
    if (secretFilePath) {
        try {
            const secretValue = (0, fs_1.readFileSync)(secretFilePath, "utf8").trim();
            if (secretValue) {
                logger.log(`Successfully read secret from file via ${fileEnvVar}: ${secretFilePath}`);
                return secretValue;
            }
            else {
                logger.warn(`Secret file is empty: ${secretFilePath}`);
            }
        }
        catch (error) {
            logger.error(`Failed to read secret file ${secretFilePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    const envValue = process.env[secretName];
    if (envValue) {
        logger.log(`Using direct environment variable: ${secretName}`);
        return envValue;
    }
    if (defaultValue) {
        logger.warn(`No secret found for ${secretName}, using default value`);
    }
    else {
        logger.warn(`No secret found for ${secretName} and no default provided`);
    }
    return defaultValue;
}
//# sourceMappingURL=readSecret.js.map