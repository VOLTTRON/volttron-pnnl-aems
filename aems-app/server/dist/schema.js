"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const node_path_1 = require("node:path");
const promises_1 = require("node:fs/promises");
const common_1 = require("@nestjs/common");
const schema_app_module_1 = require("./schema-app.module");
const logging_1 = require("./logging");
async function GenerateSchema() {
    process.env.NODE_ENV = "development";
    process.env.INSTANCE_TYPE = "";
    process.env.INSTANCE_NAME = "Schema";
    const logger = new common_1.Logger(GenerateSchema.name);
    const controller = new AbortController();
    const { signal } = controller;
    setTimeout(() => controller.abort(), 60000);
    const watcher = async () => {
        const filename = (0, node_path_1.resolve)(process.cwd(), "schema.graphql");
        await (0, promises_1.rm)(filename, { force: true });
        logger.log("Waiting for 'schema.graphql' to update...");
        let fileStats = null;
        while ((fileStats = await (0, promises_1.stat)(filename).catch(() => null)) === null && !signal.aborted) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        if (signal.aborted) {
            logger.error("Timed out waiting for 'schema.graphql' to update");
            process.exit(1);
        }
        else if (fileStats && fileStats.size === 0) {
            logger.error("'schema.graphql' was written but is empty — schema generation failed");
            process.exit(1);
        }
        else {
            logger.log("Graphql schema updated");
            process.exit(0);
        }
    };
    watcher().catch((error) => {
        logger.error(error);
        process.exit(1);
    });
    const app = await core_1.NestFactory.create(schema_app_module_1.SchemaAppModule, {
        logger: new common_1.ConsoleLogger({
            logLevels: (0, logging_1.getLogLevels)(process.env.LOG_CONSOLE_LEVEL ?? ""),
            prefix: process.env.INSTANCE_NAME ?? "",
            timestamp: true,
        }),
    });
    await app.init();
}
GenerateSchema();
//# sourceMappingURL=schema.js.map