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
exports.AppLoggerService = void 0;
const app_config_1 = require("../app.config");
const common_1 = require("@nestjs/common");
const _1 = require(".");
let AppLoggerService = class AppLoggerService {
    constructor(configService) {
        this.loggers = [];
        if (configService.log.console.level) {
            this.loggers.push(new common_1.ConsoleLogger({
                logLevels: (0, _1.getLogLevels)(configService.log.console.level),
                prefix: "Server",
                timestamp: true,
            }));
        }
    }
    registerLogger(logger) {
        if (this.loggers.includes(logger)) {
            return;
        }
        this.loggers.push(logger);
    }
    log(message, ...optionalParams) {
        this.loggers.forEach((logger) => logger.log(message, ...optionalParams));
    }
    error(message, ...optionalParams) {
        this.loggers.forEach((logger) => logger.error(message, ...optionalParams));
    }
    warn(message, ...optionalParams) {
        this.loggers.forEach((logger) => logger.warn(message, ...optionalParams));
    }
    debug(message, ...optionalParams) {
        this.loggers.forEach((logger) => logger.debug?.(message, ...optionalParams));
    }
    verbose(message, ...optionalParams) {
        this.loggers.forEach((logger) => logger.verbose?.(message, ...optionalParams));
    }
    fatal(message, ...optionalParams) {
        this.loggers.forEach((logger) => logger.fatal?.(message, ...optionalParams));
    }
    setLogLevels(levels) {
        this.loggers.forEach((logger) => logger.setLogLevels?.(levels));
    }
};
exports.AppLoggerService = AppLoggerService;
exports.AppLoggerService = AppLoggerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService])
], AppLoggerService);
//# sourceMappingURL=logging.service.js.map