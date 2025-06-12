"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesModule = void 0;
const common_1 = require("@nestjs/common");
const log_service_1 = require("./log/log.service");
const seed_service_1 = require("./seed/seed.service");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("../prisma/prisma.module");
let ServicesModule = class ServicesModule {
};
exports.ServicesModule = ServicesModule;
exports.ServicesModule = ServicesModule = __decorate([
    (0, common_1.Module)({
        imports: [schedule_1.ScheduleModule.forRoot(), prisma_module_1.PrismaModule],
        controllers: [],
        providers: [log_service_1.LogService, seed_service_1.SeedService],
    })
], ServicesModule);
//# sourceMappingURL=services.module.js.map