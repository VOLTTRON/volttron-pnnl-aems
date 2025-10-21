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
var ControlService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlService = void 0;
const common_1 = require("@nestjs/common");
const __1 = require("..");
const prisma_service_1 = require("../../prisma/prisma.service");
const app_config_1 = require("../../app.config");
const schedule_1 = require("@nestjs/schedule");
const common_2 = require("@local/common");
const node_path_1 = require("node:path");
const promises_1 = require("node:fs/promises");
const volttron_service_1 = require("../volttron.service");
const file_1 = require("../../utils/file");
const template_1 = require("../../utils/template");
const subscription_service_1 = require("../../subscription/subscription.service");
let ControlService = ControlService_1 = class ControlService extends __1.BaseService {
    constructor(prismaService, subscriptionService, configService, volttronService) {
        super("control", configService);
        this.prismaService = prismaService;
        this.subscriptionService = subscriptionService;
        this.configService = configService;
        this.volttronService = volttronService;
        this.logger = new common_1.Logger(ControlService_1.name);
    }
    execute() {
        return super.execute();
    }
    async task() {
        this.logger.debug(`Checking for intelligent load controls that need to be pushed...`);
        try {
            await this.prismaService.prisma.control
                .findMany({
                include: {
                    units: {
                        include: {
                            configuration: {
                                include: {
                                    setpoint: true,
                                    mondaySchedule: true,
                                    tuesdaySchedule: true,
                                    wednesdaySchedule: true,
                                    thursdaySchedule: true,
                                    fridaySchedule: true,
                                    saturdaySchedule: true,
                                    sundaySchedule: true,
                                    holidaySchedule: true,
                                    holidays: true,
                                    occupancies: { include: { schedule: true } },
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                where: { stage: { in: [common_2.StageType.Update.enum, common_2.StageType.Process.enum] } },
            })
                .then(async (controls) => {
                if (controls.length === 0) {
                    return;
                }
                const token = await this.volttronService.makeAuthCall();
                for (const control of controls) {
                    this.logger.log(`Pushing the control config for: ${control.label}`);
                    try {
                        if (control.peakLoadExclude) {
                            control.units = [];
                        }
                        await this.prismaService.prisma.control.update({
                            where: { id: control.id },
                            data: { stage: common_2.StageType.ProcessType.enum, message: null },
                        });
                        await this.subscriptionService.publish("Control", {
                            topic: "Control",
                            id: control.id,
                            mutation: common_2.Mutation.Updated,
                        });
                        await this.subscriptionService.publish(`Control/${control.id}`, {
                            topic: "Control",
                            id: control.id,
                            mutation: common_2.Mutation.Updated,
                        });
                        const data = {};
                        const paths = this.configService.service.control.templatePaths.map((p) => (0, node_path_1.resolve)(p));
                        for (const file of await (0, file_1.getConfigFiles)(paths, ".json", this.logger)) {
                            const key = (0, node_path_1.basename)(file, (0, node_path_1.extname)(file));
                            const text = await (0, promises_1.readFile)((0, node_path_1.resolve)(file), "utf-8");
                            const template = control.units ? JSON.parse(text) : {};
                            data[key] = (0, template_1.transformTemplate)(template, control);
                        }
                        await this.volttronService.makeApiCall(`agent.ilc`, "update_configurations", token, data);
                        await this.prismaService.prisma.control.update({
                            where: { id: control.id },
                            data: { stage: common_2.StageType.CompleteType.enum },
                        });
                        await this.subscriptionService.publish("Control", {
                            topic: "Control",
                            id: control.id,
                            mutation: common_2.Mutation.Updated,
                        });
                        await this.subscriptionService.publish(`Control/${control.id}`, {
                            topic: "Control",
                            id: control.id,
                            mutation: common_2.Mutation.Updated,
                        });
                        this.logger.log(`Finished pushing the control config for: ${control.label}`);
                    }
                    catch (error) {
                        this.logger.warn(error, `Failed to push the control config for: ${control.label}`);
                        let message = (0, common_2.typeofObject)(error, (e) => "message" in e)
                            ? error.message
                            : "Unknown error occurred while pushing control config.";
                        message = message.length > 1024 ? message.substring(0, 1024 - 3) + "..." : message;
                        await this.prismaService.prisma.control.update({
                            where: { id: control.id },
                            data: { stage: common_2.StageType.FailType.enum, message: message },
                        });
                        await this.subscriptionService.publish("Control", {
                            topic: "Control",
                            id: control.id,
                            mutation: common_2.Mutation.Updated,
                        });
                        await this.subscriptionService.publish(`Control/${control.id}`, {
                            topic: "Control",
                            id: control.id,
                            mutation: common_2.Mutation.Updated,
                        });
                    }
                }
            })
                .catch((err) => this.logger.warn(err));
        }
        catch (error) {
            this.logger.warn(error);
        }
        this.logger.debug(`Finished pushing control configs.`);
    }
};
exports.ControlService = ControlService;
__decorate([
    (0, schedule_1.Cron)(`*/10 * * * * *`),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ControlService.prototype, "execute", null);
exports.ControlService = ControlService = ControlService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        app_config_1.AppConfigService,
        volttron_service_1.VolttronService])
], ControlService);
//# sourceMappingURL=control.service.js.map