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
exports.HolidayMutation = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@local/common");
const builder_service_1 = require("../builder.service");
const query_service_1 = require("./query.service");
const object_service_1 = require("./object.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
const query_service_2 = require("../configuration/query.service");
const change_service_1 = require("../../change/change.service");
const client_1 = require("@prisma/client");
let HolidayMutation = class HolidayMutation {
    constructor(builder, prismaService, subscriptionService, holidayQuery, holidayObject, configurationQuery, changeService) {
        const { HolidayWhereUnique } = holidayQuery;
        const { HolidayType } = holidayObject;
        const { ConfigurationWhereUnique } = configurationQuery;
        const HolidayCreateConfigurations = builder.prismaCreateRelation("Holiday", "configurations", {
            fields: {
                connect: ConfigurationWhereUnique,
            },
        });
        this.HolidayCreate = builder.prismaCreate("Holiday", {
            fields: {
                stage: builder.ModelStage,
                message: "String",
                correlation: "String",
                type: HolidayType,
                label: "String",
                month: "Int",
                day: "Int",
                observance: "String",
                configurations: HolidayCreateConfigurations,
            },
        });
        const HolidayUpdateConfigurations = builder.prismaUpdateRelation("Holiday", "configurations", {
            fields: {
                connect: ConfigurationWhereUnique,
            },
        });
        this.HolidayUpdate = builder.prismaUpdate("Holiday", {
            fields: {
                stage: builder.ModelStage,
                message: "String",
                correlation: "String",
                type: HolidayType,
                label: "String",
                month: "Int",
                day: "Int",
                observance: "String",
                configurations: HolidayUpdateConfigurations,
            },
        });
        const { HolidayCreate, HolidayUpdate } = this;
        builder.mutationField("createHoliday", (t) => t.prismaField({
            description: "Create a new holiday.",
            authScopes: { user: true },
            type: "Holiday",
            args: {
                create: t.arg({ type: HolidayCreate, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                return prismaService.prisma.holiday
                    .create({
                    ...query,
                    data: { ...args.create },
                })
                    .then(async (holiday) => {
                    await subscriptionService.publish("Holiday", {
                        topic: "Holiday",
                        id: holiday.id,
                        mutation: common_2.Mutation.Created,
                    });
                    await changeService.handleChange(holiday, "Holiday", client_1.ChangeMutation.Create, ctx.user);
                    return holiday;
                });
            },
        }));
        builder.mutationField("updateHoliday", (t) => t.prismaField({
            description: "Update the specified holiday.",
            authScopes: { user: true },
            type: "Holiday",
            args: {
                where: t.arg({ type: HolidayWhereUnique, required: true }),
                update: t.arg({ type: HolidayUpdate, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                return prismaService.prisma.holiday
                    .update({
                    ...query,
                    where: args.where,
                    data: args.update,
                })
                    .then(async (holiday) => {
                    await subscriptionService.publish("Holiday", {
                        topic: "Holiday",
                        id: holiday.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    await subscriptionService.publish(`Holiday/${holiday.id}`, {
                        topic: "Holiday",
                        id: holiday.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    await changeService.handleChange(holiday, "Holiday", client_1.ChangeMutation.Update, ctx.user);
                    return holiday;
                });
            },
        }));
        builder.mutationField("deleteHoliday", (t) => t.prismaField({
            description: "Delete the specified holiday.",
            authScopes: { user: true },
            type: "Holiday",
            args: {
                where: t.arg({ type: HolidayWhereUnique, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                return prismaService.prisma.holiday
                    .delete({
                    ...query,
                    where: args.where,
                })
                    .then(async (holiday) => {
                    await subscriptionService.publish("Holiday", {
                        topic: "Holiday",
                        id: holiday.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    await subscriptionService.publish(`Holiday/${holiday.id}`, {
                        topic: "Holiday",
                        id: holiday.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    await changeService.handleChange(holiday, "Holiday", client_1.ChangeMutation.Delete, ctx.user);
                    return holiday;
                });
            },
        }));
    }
};
exports.HolidayMutation = HolidayMutation;
exports.HolidayMutation = HolidayMutation = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        query_service_1.HolidayQuery,
        object_service_1.HolidayObject,
        query_service_2.ConfigurationQuery,
        change_service_1.ChangeService])
], HolidayMutation);
//# sourceMappingURL=mutate.service.js.map