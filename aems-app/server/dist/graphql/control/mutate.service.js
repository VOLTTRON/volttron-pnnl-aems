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
exports.ControlMutation = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@local/common");
const builder_service_1 = require("../builder.service");
const query_service_1 = require("./query.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
const query_service_2 = require("../unit/query.service");
const change_service_1 = require("../../change/change.service");
const client_1 = require("@prisma/client");
let ControlMutation = class ControlMutation {
    constructor(builder, prismaService, subscriptionService, controlQuery, unitQuery, changeService) {
        const { ControlWhereUnique } = controlQuery;
        const { UnitWhereUnique } = unitQuery;
        this.ControlCreate = builder.prismaCreate("Control", {
            fields: {
                stage: builder.ModelStage,
                message: "String",
                correlation: "String",
                name: "String",
                campus: "String",
                building: "String",
                label: "String",
                peakLoadExclude: "Boolean",
                units: UnitWhereUnique,
            },
        });
        this.ControlUpdate = builder.prismaUpdate("Control", {
            fields: {
                stage: builder.ModelStage,
                message: "String",
                correlation: "String",
                name: "String",
                campus: "String",
                building: "String",
                label: "String",
                peakLoadExclude: "Boolean",
                units: UnitWhereUnique,
            },
        });
        const { ControlCreate, ControlUpdate } = this;
        builder.mutationField("createControl", (t) => t.prismaField({
            description: "Create a new control.",
            authScopes: { admin: true },
            type: "Control",
            args: {
                create: t.arg({ type: ControlCreate, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                return prismaService.prisma.control
                    .create({
                    ...query,
                    data: { ...args.create },
                })
                    .then(async (control) => {
                    await subscriptionService.publish("Control", {
                        topic: "Control",
                        id: control.id,
                        mutation: common_2.Mutation.Created,
                    });
                    await changeService.handleChange(control, "Control", client_1.ChangeMutation.Create, ctx.user);
                    return control;
                });
            },
        }));
        builder.mutationField("updateControl", (t) => t.prismaField({
            description: "Update the specified control.",
            authScopes: { user: true },
            type: "Control",
            args: {
                where: t.arg({ type: ControlWhereUnique, required: true }),
                update: t.arg({ type: ControlUpdate, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                return prismaService.prisma.control
                    .update({
                    ...query,
                    where: args.where,
                    data: args.update,
                })
                    .then(async (control) => {
                    await subscriptionService.publish("Control", {
                        topic: "Control",
                        id: control.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    await subscriptionService.publish(`Control/${control.id}`, {
                        topic: "Control",
                        id: control.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    await changeService.handleChange(control, "Control", client_1.ChangeMutation.Update, ctx.user);
                    return control;
                });
            },
        }));
        builder.mutationField("deleteControl", (t) => t.prismaField({
            description: "Delete the specified control.",
            authScopes: { admin: true },
            type: "Control",
            args: {
                where: t.arg({ type: ControlWhereUnique, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                return prismaService.prisma.control
                    .delete({
                    ...query,
                    where: args.where,
                })
                    .then(async (control) => {
                    await subscriptionService.publish("Control", {
                        topic: "Control",
                        id: control.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    await subscriptionService.publish(`Control/${control.id}`, {
                        topic: "Control",
                        id: control.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    await changeService.handleChange(control, "Control", client_1.ChangeMutation.Delete, ctx.user);
                    return control;
                });
            },
        }));
    }
};
exports.ControlMutation = ControlMutation;
exports.ControlMutation = ControlMutation = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        query_service_1.ControlQuery,
        query_service_2.UnitQuery,
        change_service_1.ChangeService])
], ControlMutation);
//# sourceMappingURL=mutate.service.js.map