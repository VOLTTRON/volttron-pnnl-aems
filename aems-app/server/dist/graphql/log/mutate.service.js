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
exports.LogMutation = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const query_service_1 = require("./query.service");
const common_2 = require("@local/common");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
const object_service_1 = require("./object.service");
let LogMutation = class LogMutation {
    constructor(builder, prismaService, subscriptionService, logObject, logQuery) {
        const { LogType } = logObject;
        const { LogWhereUnique } = logQuery;
        this.LogCreate = builder.prismaCreate("Log", {
            fields: {
                type: LogType,
                message: "String",
            },
        });
        this.LogUpdate = builder.prismaUpdate("Log", {
            fields: {
                type: LogType,
                message: "String",
            },
        });
        const { LogCreate, LogUpdate } = this;
        builder.mutationField("createLog", (t) => t.prismaField({
            description: "Create a new log.",
            authScopes: { admin: true },
            type: "Log",
            args: {
                create: t.arg({ type: LogCreate, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                const log = args.create;
                if (log.message) {
                    log.message = `${"[web-ui]: "}${log.message || ""}`;
                }
                return prismaService.prisma.log
                    .create({
                    ...query,
                    data: log,
                })
                    .then(async (log) => {
                    await subscriptionService.publish("Log", { topic: "Log", id: log.id, mutation: common_2.Mutation.Created });
                    return log;
                });
            },
        }));
        builder.mutationField("updateLog", (t) => t.prismaField({
            description: "Update the specified log.",
            authScopes: { admin: true },
            type: "Log",
            args: {
                where: t.arg({ type: LogWhereUnique, required: true }),
                update: t.arg({ type: LogUpdate, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.log
                    .update({
                    ...query,
                    where: args.where,
                    data: args.update,
                })
                    .then(async (log) => {
                    await subscriptionService.publish("Log", { topic: "Log", id: log.id, mutation: common_2.Mutation.Updated });
                    await subscriptionService.publish(`Log/${log.id}`, {
                        topic: "Log",
                        id: log.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    return log;
                });
            },
        }));
        builder.mutationField("deleteLog", (t) => t.prismaField({
            description: "Delete the specified log.",
            authScopes: { admin: true },
            type: "Log",
            args: {
                where: t.arg({ type: LogWhereUnique, required: true }),
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.log
                    .delete({
                    ...query,
                    where: args.where,
                })
                    .then(async (log) => {
                    await subscriptionService.publish("Log", { topic: "Log", id: log.id, mutation: common_2.Mutation.Deleted });
                    await subscriptionService.publish(`Log/${log.id}`, {
                        topic: "Log",
                        id: log.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    return log;
                });
            },
        }));
    }
};
exports.LogMutation = LogMutation;
exports.LogMutation = LogMutation = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        object_service_1.LogObject,
        query_service_1.LogQuery])
], LogMutation);
//# sourceMappingURL=mutate.service.js.map