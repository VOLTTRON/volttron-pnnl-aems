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
exports.FileMutation = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const query_service_1 = require("./query.service");
const query_service_2 = require("../user/query.service");
const lodash_1 = require("lodash");
const common_2 = require("@local/common");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
let FileMutation = class FileMutation {
    constructor(builder, prismaService, subscriptionService, fileQuery, userQuery) {
        const { FileWhereUnique } = fileQuery;
        const { UserWhereUnique } = userQuery;
        this.FileUpdateUser = builder.prismaCreateRelation("File", "user", {
            fields: {
                connect: UserWhereUnique,
            },
        });
        this.FileCreate = builder.prismaCreate("File", {
            fields: {
                objectKey: "String",
                mimeType: "String",
                contentLength: "Int",
                user: this.FileUpdateUser,
            },
        });
        this.FileUpdate = builder.prismaUpdate("File", {
            fields: {
                objectKey: "String",
                mimeType: "String",
                contentLength: "Int",
                user: this.FileUpdateUser,
            },
        });
        const { FileCreate, FileUpdate } = this;
        builder.mutationField("createFile", (t) => t.prismaField({
            description: "Create a local file record.",
            authScopes: { user: true },
            type: "File",
            args: {
                create: t.arg({ type: FileCreate, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                const file = (0, lodash_1.pick)(args.create, ["objectKey", "mimeType", "contentLength"]);
                const create = args.create;
                if (!ctx.user?.authRoles.admin || !create.user) {
                    delete create.user;
                    create.user = { connect: { id: ctx.user?.id } };
                }
                return prismaService.prisma.file
                    .create({
                    ...query,
                    data: file,
                })
                    .then(async (file) => {
                    await subscriptionService.publish("File", {
                        topic: "File",
                        id: file.id,
                        mutation: common_2.Mutation.Created,
                    });
                    return file;
                });
            },
        }));
        builder.mutationField("updateFile", (t) => t.prismaField({
            description: "Update a local file record.",
            authScopes: { user: true },
            type: "File",
            args: {
                where: t.arg({ type: FileWhereUnique, required: true }),
                update: t.arg({ type: FileUpdate, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                const where = args.where ?? {};
                if (!ctx.user?.authRoles.admin) {
                    delete where.user;
                    where.userId = ctx.user?.id;
                }
                return prismaService.prisma.file
                    .update({
                    ...query,
                    data: args.update,
                    where,
                })
                    .then(async (file) => {
                    await subscriptionService.publish("File", {
                        topic: "File",
                        id: file.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    await subscriptionService.publish(`File/${file.id}`, {
                        topic: "File",
                        id: file.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    return file;
                });
            },
        }));
        builder.mutationField("deleteFile", (t) => t.prismaField({
            description: "Delete a local file record.",
            authScopes: { user: true },
            type: "File",
            args: {
                where: t.arg({ type: FileWhereUnique, required: true }),
            },
            resolve: async (query, _root, args, ctx, _info) => {
                const where = args.where ?? {};
                if (!ctx.user?.authRoles.admin) {
                    delete where.user;
                    where.userId = ctx.user?.id;
                }
                return prismaService.prisma.file
                    .delete({
                    ...query,
                    where,
                })
                    .then(async (file) => {
                    await subscriptionService.publish("File", {
                        topic: "File",
                        id: file.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    await subscriptionService.publish(`File/${file.id}`, {
                        topic: "File",
                        id: file.id,
                        mutation: common_2.Mutation.Deleted,
                    });
                    return file;
                });
            },
        }));
    }
};
exports.FileMutation = FileMutation;
exports.FileMutation = FileMutation = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        query_service_1.FileQuery,
        query_service_2.UserQuery])
], FileMutation);
//# sourceMappingURL=mutate.service.js.map