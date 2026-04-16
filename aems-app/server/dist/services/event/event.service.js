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
var EventService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const __1 = require("..");
const app_config_1 = require("../../app.config");
const common_2 = require("@local/common");
let EventService = EventService_1 = class EventService extends __1.BaseService {
    constructor(prismaService, configService) {
        super("event", configService);
        this.prismaService = prismaService;
        this.logger = new common_1.Logger(EventService_1.name);
        this.prune = configService.service.event.prune;
        this.ageValue = configService.service.event.age.value;
        this.ageUnit = configService.service.event.age.unit;
    }
    execute() {
        return super.execute();
    }
    schedule() {
        if (!this.prune) {
            return false;
        }
        return super.schedule();
    }
    async task() {
        this.logger.log("Pruning old events...");
        const ageInMilliseconds = common_2.Frequency.convert(this.ageUnit, this.ageValue, common_2.Frequency.Millisecond);
        const cutoffDate = new Date(Date.now() - ageInMilliseconds);
        this.logger.log(`Deleting events older than ${this.ageValue} ${this.ageUnit} (before ${cutoffDate.toISOString()})`);
        await this.prismaService.prisma.event
            .deleteMany({ where: { createdAt: { lt: cutoffDate } } })
            .then((result) => {
            this.logger.log(`Successfully pruned ${result.count} old events.`);
        })
            .catch((error) => {
            this.logger.warn({ message: error.message, stack: error.stack });
        });
    }
};
exports.EventService = EventService;
__decorate([
    (0, schedule_1.Timeout)(1000),
    (0, schedule_1.Cron)("0 0 * * *"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EventService.prototype, "execute", null);
exports.EventService = EventService = EventService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_1.AppConfigService])
], EventService);
//# sourceMappingURL=event.service.js.map