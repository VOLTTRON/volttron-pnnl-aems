"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaLogger = void 0;
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const app_config_1 = require("../app.config");
const _1 = require(".");
const logging_service_1 = require("./logging.service");
const getPrismaLogType = (level) => {
    switch (level) {
        case "fatal":
            return "Fatal";
        case "error":
            return "Error";
        case "warn":
            return "Warn";
        case "log":
            return "Info";
        case "debug":
            return "Debug";
        case "verbose":
            return "Trace";
        default:
            throw new Error(`Invalid log level: ${level}`);
    }
};
let PrismaLogger = class PrismaLogger extends common_1.ConsoleLogger {
    constructor(configService, prismaService, loggerService) {
        super({
            logLevels: (0, _1.getLogLevels)(configService.log.database.level),
            prefix: "Server",
            timestamp: true,
        });
        this.prismaService = prismaService;
        loggerService.registerLogger(this);
    }
    printMessages(messages, context = "", logLevel = "log", writeStreamType, errorStack) {
        messages.forEach((message) => {
            if (this.options.json) {
                this.printAsJson(message, {
                    context,
                    logLevel,
                    writeStreamType,
                    errorStack,
                });
                return;
            }
            const pidMessage = this.formatPid(process.pid);
            const contextMessage = this.formatContext(context);
            const timestampDiff = this.updateAndGetTimestampDiff();
            const formattedLogLevel = logLevel.toUpperCase().padStart(7, " ");
            const formattedMessage = this.formatMessage(logLevel, message, pidMessage, formattedLogLevel, contextMessage, timestampDiff);
            this.prismaService.prisma.log
                .create({
                data: {
                    type: getPrismaLogType(logLevel),
                    message: formattedMessage,
                },
            })
                .catch((error) => {
                console.error("Failed to log to database", error);
            });
        });
    }
};
exports.PrismaLogger = PrismaLogger;
exports.PrismaLogger = PrismaLogger = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService,
        prisma_service_1.PrismaService,
        logging_service_1.AppLoggerService])
], PrismaLogger);
//# sourceMappingURL=logger.service.js.map