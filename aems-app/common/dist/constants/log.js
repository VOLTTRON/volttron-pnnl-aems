"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class Log extends base_1.default {
    constructor() {
        super([
            {
                name: "trace",
                label: "Trace",
                enum: "Trace",
                level: "10",
            },
            {
                name: "debug",
                label: "Debug",
                enum: "Debug",
                level: "20",
            },
            {
                name: "info",
                label: "Info",
                enum: "Info",
                level: "30",
            },
            {
                name: "warn",
                label: "Warn",
                enum: "Warn",
                level: "40",
            },
            {
                name: "error",
                label: "Error",
                enum: "Error",
                level: "50",
            },
            {
                name: "fatal",
                label: "Fatal",
                enum: "Fatal",
                level: "60",
            },
        ]);
        this.Trace = this.parseStrict("trace");
        this.TraceType = this.parseStrict("trace");
        this.Debug = this.parseStrict("debug");
        this.DebugType = this.parseStrict("debug");
        this.Info = this.parseStrict("info");
        this.InfoType = this.parseStrict("info");
        this.Warn = this.parseStrict("warn");
        this.WarnType = this.parseStrict("warn");
        this.Error = this.parseStrict("error");
        this.ErrorType = this.parseStrict("error");
        this.Fatal = this.parseStrict("fatal");
        this.FatalType = this.parseStrict("fatal");
    }
}
const log = new Log();
exports.default = log;
//# sourceMappingURL=log.js.map