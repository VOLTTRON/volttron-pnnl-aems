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
var CleanupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanupService = void 0;
const common_1 = require("@nestjs/common");
const __1 = require("..");
const prisma_service_1 = require("../../prisma/prisma.service");
const app_config_1 = require("../../app.config");
const schedule_1 = require("@nestjs/schedule");
const common_2 = require("@local/common");
let CleanupService = CleanupService_1 = class CleanupService extends __1.BaseService {
    constructor(prismaService, configService) {
        super("cleanup", configService);
        this.prismaService = prismaService;
        this.logger = new common_1.Logger(CleanupService_1.name);
        this.started = new Date(new Date().getTime() - process.uptime() * 1000);
    }
    execute() {
        return super.execute();
    }
    async task() {
        this.logger.log("Checking for occupancies that need to be cleaned up...");
        return this.prismaService.prisma.occupancy
            .findMany({
            where: { date: { lt: new Date(Date.now() - this.started.getTime()) } },
            include: { configuration: { include: { units: true } } },
        })
            .then(async (occupancies) => {
            const occupancyIds = occupancies.map((occupancy) => occupancy.id);
            const unitIds = new Set(occupancies
                .map((occupancy) => occupancy.configuration?.units.map((unit) => unit.id))
                .flat()
                .filter((id) => (0, common_2.typeofNonNullable)(id)));
            const result = await this.prismaService.prisma.occupancy.deleteMany({
                where: { id: { in: occupancyIds } },
            });
            await this.prismaService.prisma.unit.updateMany({
                where: { id: { in: Array.from(unitIds) } },
                data: { stage: common_2.StageType.ProcessType.enum },
            });
            this.logger.log(`Cleaned up ${result.count} ${result.count === 1 ? " occupancy" : " occupancies"} that occurred prior to ${this.started.toLocaleDateString()}.`);
        })
            .catch((error) => {
            this.logger.warn({ message: error.message, stack: error.stack });
        });
    }
};
exports.CleanupService = CleanupService;
__decorate([
    (0, schedule_1.Cron)(`0 0 * * *`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CleanupService.prototype, "execute", null);
exports.CleanupService = CleanupService = CleanupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_1.AppConfigService])
], CleanupService);
//# sourceMappingURL=cleanup.service.js.map