"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const services_module_1 = require("../services/services.module");
const backup_controller_1 = require("./backup.controller");
const backup_service_1 = require("./backup.service");
const token_guard_1 = require("./token.guard");
let WorkerModule = class WorkerModule {
};
exports.WorkerModule = WorkerModule;
exports.WorkerModule = WorkerModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, services_module_1.ServicesModule],
        controllers: [backup_controller_1.BackupWorkerController],
        providers: [backup_service_1.BackupWorkerService, token_guard_1.WorkerTokenGuard],
    })
], WorkerModule);
//# sourceMappingURL=worker.module.js.map