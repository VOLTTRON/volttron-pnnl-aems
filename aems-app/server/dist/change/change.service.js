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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeService = void 0;
const prisma_service_1 = require("../prisma/prisma.service");
const subscription_service_1 = require("../subscription/subscription.service");
const common_1 = require("@local/common");
const common_2 = require("@nestjs/common");
let ChangeService = class ChangeService {
    constructor(prismaService, subscriptionService) {
        this.prismaService = prismaService;
        this.subscriptionService = subscriptionService;
    }
    transform(entity) {
        Object.entries(entity).forEach(([key, value]) => {
            if (value === undefined) {
                delete entity[key];
            }
            else if (value instanceof Date) {
                entity[key] = value.toISOString();
            }
            else if ((0, common_1.typeofObject)(value, (v) => typeof v === "object")) {
                entity[key] = this.transform(value);
            }
        });
        return entity;
    }
    async handleChange(entity, type, mutation, user) {
        const userId = typeof user === "string" ? user : user.id;
        if (type === "Schedule" && (0, common_1.typeofObject)(entity)) {
            await this.prismaService.prisma.change
                .create({
                data: {
                    key: entity.id,
                    data: this.transform(entity),
                    mutation: mutation,
                    table: "schedule",
                    userId: userId,
                },
            })
                .then(async (change) => {
                await this.subscriptionService.publish("Change", {
                    topic: "Change",
                    id: change.id,
                    mutation: common_1.Mutation.Created,
                });
            });
        }
        else if (type === "Configuration" && (0, common_1.typeofObject)(entity)) {
            await this.prismaService.prisma.change
                .create({
                data: {
                    key: entity.id,
                    data: this.transform(entity),
                    mutation: mutation,
                    table: "configuration",
                    userId: userId,
                },
            })
                .then(async (change) => {
                await this.subscriptionService.publish("Change", {
                    topic: "Change",
                    id: change.id,
                    mutation: common_1.Mutation.Created,
                });
            });
        }
        else if (type === "Control" && (0, common_1.typeofObject)(entity)) {
            await this.prismaService.prisma.change
                .create({
                data: {
                    key: entity.id,
                    data: this.transform(entity),
                    mutation: mutation,
                    table: "control",
                    userId: userId,
                },
            })
                .then(async (change) => {
                await this.subscriptionService.publish("Change", {
                    topic: "Change",
                    id: change.id,
                    mutation: common_1.Mutation.Created,
                });
            });
        }
        else if (type === "Location" && (0, common_1.typeofObject)(entity)) {
            await this.prismaService.prisma.change
                .create({
                data: {
                    key: entity.id,
                    data: this.transform(entity),
                    mutation: mutation,
                    table: "location",
                    userId: userId,
                },
            })
                .then(async (change) => {
                await this.subscriptionService.publish("Change", {
                    topic: "Change",
                    id: change.id,
                    mutation: common_1.Mutation.Created,
                });
            });
        }
        else if (type === "Unit" && (0, common_1.typeofObject)(entity)) {
            await this.prismaService.prisma.change
                .create({
                data: {
                    key: entity.id,
                    data: this.transform(entity),
                    mutation: mutation,
                    table: "unit",
                    userId: userId,
                },
            })
                .then(async (change) => {
                await this.subscriptionService.publish("Change", {
                    topic: "Change",
                    id: change.id,
                    mutation: common_1.Mutation.Created,
                });
            });
        }
        else if (type === "Occupancy" && (0, common_1.typeofObject)(entity)) {
            await this.prismaService.prisma.change
                .create({
                data: {
                    key: entity.id,
                    data: this.transform(entity),
                    mutation: mutation,
                    table: "occupancy",
                    userId: userId,
                },
            })
                .then(async (change) => {
                await this.subscriptionService.publish("Change", {
                    topic: "Change",
                    id: change.id,
                    mutation: common_1.Mutation.Created,
                });
            });
        }
        else if (type === "Holiday" && (0, common_1.typeofObject)(entity)) {
            await this.prismaService.prisma.change
                .create({
                data: {
                    key: entity.id,
                    data: this.transform(entity),
                    mutation: mutation,
                    table: "holiday",
                    userId: userId,
                },
            })
                .then(async (change) => {
                await this.subscriptionService.publish("Change", {
                    topic: "Change",
                    id: change.id,
                    mutation: common_1.Mutation.Created,
                });
            });
        }
        else if (type === "Setpoint" && (0, common_1.typeofObject)(entity)) {
            await this.prismaService.prisma.change
                .create({
                data: {
                    key: entity.id,
                    data: this.transform(entity),
                    mutation: mutation,
                    table: "setpoint",
                    userId: userId,
                },
            })
                .then(async (change) => {
                await this.subscriptionService.publish("Change", {
                    topic: "Change",
                    id: change.id,
                    mutation: common_1.Mutation.Created,
                });
            });
        }
    }
};
exports.ChangeService = ChangeService;
exports.ChangeService = ChangeService = __decorate([
    (0, common_2.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService])
], ChangeService);
//# sourceMappingURL=change.service.js.map