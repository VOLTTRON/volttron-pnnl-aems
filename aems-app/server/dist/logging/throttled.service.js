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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThrottledLoggerService = void 0;
const app_config_1 = require("../app.config");
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let ThrottledLoggerService = class ThrottledLoggerService {
    constructor(wrappedLogger, configService) {
        this.wrappedLogger = wrappedLogger;
        this.configService = configService;
        this.throttleCache = new Map();
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
    generateSignature(level, message, context) {
        const messageStr = typeof message === "string" ? message : JSON.stringify(message);
        const contextStr = context || "";
        const combined = `${level}:${contextStr}:${messageStr}`;
        return (0, crypto_1.createHash)("md5").update(combined).digest("hex");
    }
    getThrottleWindow(level) {
        return this.configService.log.throttle.debounce[level] || this.configService.log.throttle.debounce.log;
    }
    shouldLog(signature, level) {
        if (!this.configService.log.throttle.enabled) {
            return true;
        }
        const entry = this.throttleCache.get(signature);
        if (!entry) {
            return true;
        }
        const windowMs = this.getThrottleWindow(level) * 1000;
        const timeSinceLastLog = Date.now() - entry.lastLogged.getTime();
        return timeSinceLastLog >= windowMs;
    }
    updateCache(signature, level, message, context, logged = false) {
        const now = new Date();
        const entry = this.throttleCache.get(signature);
        if (!entry) {
            this.throttleCache.set(signature, {
                firstSeen: now,
                lastSeen: now,
                lastLogged: now,
                count: 1,
                signature,
                level,
                message: typeof message === "string" ? message : JSON.stringify(message),
                context,
            });
        }
        else {
            entry.lastSeen = now;
            entry.count += 1;
            if (logged) {
                entry.lastLogged = now;
                entry.firstSeen = now;
                entry.count = 1;
            }
        }
    }
    formatMessage(signature, message) {
        const entry = this.throttleCache.get(signature);
        if (!entry || entry.count <= 1) {
            return message;
        }
        if (typeof message === "string") {
            const windowSeconds = this.getThrottleWindow(entry.level);
            const minutes = Math.floor(windowSeconds / 60);
            const timeUnit = minutes > 0 ? `${minutes} minute${minutes !== 1 ? "s" : ""}` : `${windowSeconds} seconds`;
            return `${message} [occurred ${entry.count} times in last ${timeUnit}]`;
        }
        return message;
    }
    formatContext(signature, context) {
        const entry = this.throttleCache.get(signature);
        if (!entry || entry.count <= 1) {
            return context;
        }
        const windowSeconds = this.getThrottleWindow(entry.level);
        const minutes = Math.floor(windowSeconds / 60);
        const timeUnit = minutes > 0 ? `${minutes} minute${minutes !== 1 ? "s" : ""}` : `${windowSeconds} seconds`;
        const countInfo = `[occurred ${entry.count} times in last ${timeUnit}]`;
        return context ? `${context} ${countInfo}` : countInfo;
    }
    cleanup() {
        const now = Date.now();
        const maxAge = Math.max(...Object.values(this.configService.log.throttle.debounce)) * 2 * 1000;
        for (const [signature, entry] of this.throttleCache.entries()) {
            const age = now - entry.lastSeen.getTime();
            if (age > maxAge) {
                this.throttleCache.delete(signature);
            }
        }
    }
    logWithThrottle(level, logMethod, message, ...optionalParams) {
        const context = optionalParams.length > 0 ? String(optionalParams[0]) : undefined;
        const signature = this.generateSignature(level, message, context);
        if (this.shouldLog(signature, level)) {
            const formattedMessage = this.formatMessage(signature, message);
            if (typeof message === "string" || optionalParams.length === 0) {
                logMethod.call(this.wrappedLogger, formattedMessage, ...optionalParams);
            }
            else {
                const formattedContext = this.formatContext(signature, context);
                const newParams = [...optionalParams];
                if (newParams.length > 0) {
                    newParams[0] = formattedContext;
                }
                logMethod.call(this.wrappedLogger, formattedMessage, ...newParams);
            }
            this.updateCache(signature, level, message, context, true);
        }
        else {
            this.updateCache(signature, level, message, context, false);
        }
    }
    log(message, ...optionalParams) {
        this.logWithThrottle("log", this.wrappedLogger.log.bind(this.wrappedLogger), message, ...optionalParams);
    }
    error(message, ...optionalParams) {
        this.logWithThrottle("error", this.wrappedLogger.error.bind(this.wrappedLogger), message, ...optionalParams);
    }
    warn(message, ...optionalParams) {
        this.logWithThrottle("warn", this.wrappedLogger.warn.bind(this.wrappedLogger), message, ...optionalParams);
    }
    debug(message, ...optionalParams) {
        if (this.wrappedLogger.debug) {
            this.logWithThrottle("debug", this.wrappedLogger.debug.bind(this.wrappedLogger), message, ...optionalParams);
        }
    }
    verbose(message, ...optionalParams) {
        if (this.wrappedLogger.verbose) {
            this.logWithThrottle("verbose", this.wrappedLogger.verbose.bind(this.wrappedLogger), message, ...optionalParams);
        }
    }
    fatal(message, ...optionalParams) {
        if (this.wrappedLogger.fatal) {
            this.logWithThrottle("fatal", this.wrappedLogger.fatal.bind(this.wrappedLogger), message, ...optionalParams);
        }
    }
    setLogLevels(levels) {
        if (this.wrappedLogger.setLogLevels) {
            this.wrappedLogger.setLogLevels(levels);
        }
    }
    getStats() {
        return {
            cacheSize: this.throttleCache.size,
            entries: Array.from(this.throttleCache.values()),
        };
    }
    clearCache() {
        this.throttleCache.clear();
    }
    onModuleDestroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
};
exports.ThrottledLoggerService = ThrottledLoggerService;
exports.ThrottledLoggerService = ThrottledLoggerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object, app_config_1.AppConfigService])
], ThrottledLoggerService);
//# sourceMappingURL=throttled.service.js.map