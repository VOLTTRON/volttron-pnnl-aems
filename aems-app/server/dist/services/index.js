"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const lodash_1 = require("lodash");
class BaseService {
    constructor(service, configService) {
        this.service = service;
        this.running = false;
        const instance = configService.instanceType;
        const types = instance.split(/[, |-]+/).map(lodash_1.toLower);
        const runAll = (0, lodash_1.isEmpty)(instance) || (0, lodash_1.isEqual)(types, ["services"]);
        const runService = types.includes((0, lodash_1.toLower)(this.service));
        this.runTask = runAll || runService;
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
            });
        }
    }
}
exports.BaseService = BaseService;
//# sourceMappingURL=index.js.map