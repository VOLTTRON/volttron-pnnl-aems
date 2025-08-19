"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const node_path_1 = require("node:path");
const promises_1 = require("node:fs/promises");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const logging_1 = require("./logging");
async function GenerateSchema() {
    process.env.NODE_ENV = "development";
    process.env.INSTANCE_TYPE = "";
    const logger = new common_1.Logger(GenerateSchema.name);
    const controller = new AbortController();
    const { signal } = controller;
    setTimeout(() => controller.abort(), 60000);
    const watcher = async () => {
        const filename = (0, node_path_1.resolve)(process.cwd(), "schema.graphql");
        await (0, promises_1.rm)(filename, { force: true });
        logger.log("Waiting for 'schema.graphql' to update...");
        while ((await (0, promises_1.stat)(filename).catch(() => null)) === null && !signal.aborted) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        if (signal.aborted) {
            logger.error("Timed out waiting for 'schema.graphql' to update");
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
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: new common_1.ConsoleLogger({
            logLevels: (0, logging_1.getLogLevels)(process.env.LOG_CONSOLE_LEVEL ?? ""),
            prefix: "Server",
            timestamp: true,
        }),
    });
    await app.init();
}
GenerateSchema();
//# sourceMappingURL=schema.js.map