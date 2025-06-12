"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const logging_1 = require("./logging");
const auth_service_1 = require("./auth/auth.service");
const app_config_1 = require("./app.config");
const common_2 = require("@local/common");
const util_1 = require("util");
const logging_service_1 = require("./logging/logging.service");
const platform_ws_1 = require("@nestjs/platform-ws");
async function MainBootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    app.useLogger(app.get(logging_service_1.AppLoggerService));
    const mainLogger = new common_1.Logger(MainBootstrap.name);
    if (process.env.LOG_HTTP_REQUEST_LEVEL) {
        const httpLogger = new common_1.Logger("HttpRequest");
        const level = (0, logging_1.getLogLevel)(process.env.LOG_HTTP_REQUEST_LEVEL) ?? "log";
        app.use(function (req, res, next) {
            const start = Date.now();
            res.on("finish", () => {
                httpLogger[level](`${req.method} ${req.originalUrl} ${res.statusCode} ${res.statusMessage} - ${res.get("Content-Length") || 0}b sent in ${Date.now() - start}ms`);
            });
            next();
        });
    }
    if (process.env.NODE_ENV !== "production") {
        mainLogger.warn("CORS enabled for non-production environment");
        app.enableCors({
            origin: process.env.CORS_ORIGIN ?? "*",
            methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
            credentials: true,
        });
    }
    const authService = app.get(auth_service_1.AuthService);
    app.use(authService.session);
    app.use(authService.passport.initialize());
    app.use(authService.passport.authenticate(auth_service_1.Session));
    const wsAdapter = new platform_ws_1.WsAdapter(app);
    app.useWebSocketAdapter(wsAdapter);
    const documentBuilder = new swagger_1.DocumentBuilder().setTitle("API").setVersion("1.0").build();
    const documentFactory = () => swagger_1.SwaggerModule.createDocument(app, documentBuilder);
    swagger_1.SwaggerModule.setup("swagger", app, documentFactory);
    const configService = app.get(app_config_1.AppConfigService.Key);
    if (configService.nodeEnv !== "production") {
        (0, common_2.printEnvironment)({
            printable: (v) => mainLogger.log(v),
            stringify: (v) => (0, util_1.inspect)(v, undefined, 2, true),
        });
    }
    await app.listen(configService.port);
}
MainBootstrap();
//# sourceMappingURL=main.js.map