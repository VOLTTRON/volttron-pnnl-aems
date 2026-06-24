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
var BackupWorkerController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupWorkerController = void 0;
const common_1 = require("@nestjs/common");
const backup_service_1 = require("./backup.service");
const token_guard_1 = require("./token.guard");
const public_decorator_1 = require("../auth/public.decorator");
let BackupWorkerController = BackupWorkerController_1 = class BackupWorkerController {
    constructor(workerService) {
        this.workerService = workerService;
        this.logger = new common_1.Logger(BackupWorkerController_1.name);
    }
    async claim() {
        const result = await this.workerService.claimNextRun();
        return result ?? { claimed: false };
    }
    async reconcileStale(body) {
        const staleMs = Number(body?.staleMs);
        if (!Number.isFinite(staleMs) || staleMs <= 0) {
            return { reconciled: 0 };
        }
        const reconciled = await this.workerService.reconcileStale(staleMs);
        return { reconciled };
    }
    async heartbeat(id) {
        return this.workerService.heartbeat(id);
    }
    async component(id, body) {
        await this.workerService.upsertComponent(id, body);
    }
    async destination(id, body) {
        await this.workerService.upsertRunDestination(id, body);
    }
    async archive(id, body) {
        await this.workerService.updateRunArchive(id, body);
    }
    async finalize(id, body) {
        await this.workerService.finalizeRun(id, body);
        return { ok: true };
    }
    async upsertKey(body) {
        return this.workerService.upsertKey(body);
    }
};
exports.BackupWorkerController = BackupWorkerController;
__decorate([
    (0, common_1.Post)("runs/claim"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BackupWorkerController.prototype, "claim", null);
__decorate([
    (0, common_1.Post)("runs/reconcile-stale"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BackupWorkerController.prototype, "reconcileStale", null);
__decorate([
    (0, common_1.Post)("runs/:id/heartbeat"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BackupWorkerController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Post)("runs/:id/components"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BackupWorkerController.prototype, "component", null);
__decorate([
    (0, common_1.Post)("runs/:id/destinations"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BackupWorkerController.prototype, "destination", null);
__decorate([
    (0, common_1.Post)("runs/:id/archive"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BackupWorkerController.prototype, "archive", null);
__decorate([
    (0, common_1.Post)("runs/:id/finalize"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BackupWorkerController.prototype, "finalize", null);
__decorate([
    (0, common_1.Post)("keys/upsert"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BackupWorkerController.prototype, "upsertKey", null);
exports.BackupWorkerController = BackupWorkerController = BackupWorkerController_1 = __decorate([
    (0, common_1.Controller)("worker/backup"),
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(token_guard_1.WorkerTokenGuard),
    __metadata("design:paramtypes", [backup_service_1.BackupWorkerService])
], BackupWorkerController);
//# sourceMappingURL=backup.controller.js.map