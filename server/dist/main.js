"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const logging_1 = require("./logging");
const app_config_1 = require("./app.config");
const common_2 = require("@local/common");
const express_1 = require("express");
const util_1 = require("util");
const logging_service_1 = require("./logging/logging.service");
const platform_ws_1 = require("@nestjs/platform-ws");
async function MainBootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    app.set("trust proxy", true);
    app.use((0, express_1.json)());
    app.use((0, express_1.urlencoded)({ extended: true }));
    const configService = app.get(app_config_1.AppConfigService.Key);
    app.useLogger(app.get(logging_service_1.AppLoggerService));
    const mainLogger = new common_1.Logger(MainBootstrap.name);
    if (configService.log.http.level) {
        const httpLogger = new common_1.Logger("HttpRequest");
        const level = (0, logging_1.getLogLevel)(configService.log.http.level) ?? "log";
        app.use(function (req, res, next) {
            const start = Date.now();
            res.on("finish", () => {
                httpLogger[level](`${req.method} ${req.originalUrl} ${res.statusCode} ${res.statusMessage} - ${res.get("Content-Length") || 0}b sent in ${Date.now() - start}ms`);
            });
            next();
        });
    }
    if (configService.nodeEnv !== "production") {
        mainLogger.warn("CORS enabled for non-production environment");
        app.enableCors({
            origin: "*",
            methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
            credentials: true,
        });
    }
    const wsAdapter = new platform_ws_1.WsAdapter(app);
    app.useWebSocketAdapter(wsAdapter);
    const documentBuilder = new swagger_1.DocumentBuilder().setTitle("API").setVersion("1.0").build();
    const documentFactory = () => swagger_1.SwaggerModule.createDocument(app, documentBuilder);
    swagger_1.SwaggerModule.setup("swagger", app, documentFactory);
    if (configService.nodeEnv !== "production" || configService.printEnv) {
        (0, common_2.printEnvironment)({
            printable: (v) => mainLogger.log(v),
            stringify: (v) => (0, util_1.inspect)(v, undefined, 2, true),
        });
    }
    await app.listen(configService.port);
    process.on("SIGTERM", () => {
        gracefulShutdown(app);
    });
}
async function gracefulShutdown(app) {
    try {
        await app.close();
        console.log("Cleanup finished. Shutting down.");
    }
    catch (error) {
        console.error("Error during shutdown", error);
    }
    finally {
        process.exit(0);
    }
}
MainBootstrap();
//# sourceMappingURL=main.js.map