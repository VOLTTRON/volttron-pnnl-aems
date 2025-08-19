"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const common_1 = require("@local/common");
const common_2 = require("@nestjs/common");
const lodash_1 = require("lodash");
const node_util_1 = require("node:util");
class BaseService {
    constructor(service, configService) {
        this.baseLogger = new common_2.Logger(BaseService.name);
        this.running = false;
        this.service = (0, lodash_1.toLower)(service.trim());
        const instance = configService.instanceType.trim();
        const types = instance.split(/[, ]+/).map(lodash_1.toLower).map(lodash_1.trim);
        const shutdown = types.map((type) => /^\^([^*!^]+)$/.exec(type)?.[1]).filter(common_1.typeofNonNullable);
        if (shutdown.length > 1) {
            throw new Error(`Can only specify a single shutdown service: ${types.join(",")}`);
        }
        const enabled = types.map((type) => /^([^*!^]+)$/.exec(type)?.[1]).filter(common_1.typeofNonNullable);
        if (shutdown.length > 0 && enabled.length > 0) {
            throw new Error(`Can't specify both shutdown and enabled services: ${types.join(",")}`);
        }
        enabled.push(...shutdown);
        const wildcard = types.filter((type) => /^\*$/.exec(type)?.[0]).filter(common_1.typeofNonNullable).length > 0;
        if (wildcard) {
            enabled.push(this.service);
        }
        const disabled = types.map((type) => /^!([^*!^]+)$/.exec(type)?.[1]).filter(common_1.typeofNonNullable);
        this.shutdown = shutdown.includes(this.service);
        this.runTask = enabled.includes(this.service) && !disabled.includes(this.service);
        console.log((0, node_util_1.inspect)({
            instance: instance,
            service: { service: this.service, shutdown: this.shutdown, runTask: this.runTask },
            lists: { types, wildcard, enabled, disabled, shutdown },
        }, undefined, 10, true));
    }
    schedule() {
        if (this.running || !this.runTask) {
            return false;
        }
        this.running = true;
        return true;
    }
    async execute() {
        if (this.schedule()) {
            await this.task().finally(() => {
                this.running = false;
                if (this.shutdown) {
                    this.baseLogger.log("Seeding completed successfully. Shutting down...");
                    process.kill(process.pid, "SIGTERM");
                }
            });
        }
    }
}
exports.BaseService = BaseService;
//# sourceMappingURL=index.js.map