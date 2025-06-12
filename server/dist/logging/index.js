"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfoLogger = exports.getLogLevels = exports.getLogLevel = exports.LogLevels = void 0;
const common_1 = require("@nestjs/common");
exports.LogLevels = ["fatal", "error", "warn", "log", "debug", "verbose"];
const getLogLevel = (level) => {
    switch (level.toLowerCase().trim()) {
        case "fatal":
            return "fatal";
        case "error":
            return "error";
        case "warn":
            return "warn";
        case "log":
        case "info":
            return "log";
        case "debug":
            return "debug";
        case "verbose":
        case "trace":
            return "verbose";
        default:
            return undefined;
    }
};
exports.getLogLevel = getLogLevel;
const getLogLevelStrict = (level) => {
    const logLevel = (0, exports.getLogLevel)(level);
    if (logLevel) {
        return logLevel;
    }
    else {
        throw new Error(`Invalid log level: ${level}`);
    }
};
const getLogLevels = (level) => exports.LogLevels.slice(0, exports.LogLevels.indexOf(getLogLevelStrict(level)) + 1);
exports.getLogLevels = getLogLevels;
class InfoLogger extends common_1.Logger {
    info(message, ...optionalParams) {
        super.log(message, optionalParams);
    }
}
exports.InfoLogger = InfoLogger;
//# sourceMappingURL=index.js.map