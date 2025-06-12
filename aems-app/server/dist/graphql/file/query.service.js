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
exports.FileQuery = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const object_service_1 = require("./object.service");
const query_service_1 = require("../user/query.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
let FileQuery = class FileQuery {
    constructor(builder, prismaService, fileObject, userQuery) {
        const { StringFilter, PagingInput } = builder;
        const { FileFields } = fileObject;
        const { UserWhereUnique } = userQuery;
        this.FileWhereUnique = builder.prismaWhereUnique("File", {
            fields: {
                id: "String",
            },
        });
        this.FileWhere = builder.prismaWhere("File", {
            fields: {
                OR: true,
                AND: true,
                NOT: true,
                id: StringFilter,
                feedbackId: StringFilter,
                userId: StringFilter,
                user: UserWhereUnique,
            },
        });
        this.FileOrderBy = builder.prismaOrderBy("File", {
            fields: {
                id: true,
                feedbackId: true,
                userId: true,
            },
        });
        this.FileAggregate = builder.inputType("FileAggregate", {
            fields: (t) => ({
                average: t.field({ type: [FileFields] }),
                count: t.field({ type: [FileFields] }),
                maximum: t.field({ type: [FileFields] }),
                minimum: t.field({ type: [FileFields] }),
                sum: t.field({ type: [FileFields] }),
            }),
        });
        const { FileWhere, FileWhereUnique, FileOrderBy, FileAggregate } = this;
        builder.queryField("pageFile", (t) => t.prismaConnection({
            description: "Paginate through multiple files.",
            authScopes: { user: true },
            type: "File",
            cursor: "id",
            args: {
                where: t.arg({ type: FileWhere }),
            },
            resolve: async (query, _parent, args, ctx, _info) => {
                const where = args.where ?? {};
                if (!ctx.user?.authRoles.admin) {
                    delete where.user;
                    where.userId = ctx.user?.id;
                }
                return prismaService.prisma.file.findMany({
                    ...query,
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("readFile", (t) => t.prismaField({
            description: "Read a specific file by its ID",
            authScopes: { user: true },
            type: "File",
            args: {
                where: t.arg({ type: FileWhereUnique, required: true }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _feedback, args, _context, _info) => {
                subscriptions.register(`File/${args.where.id}`);
            },
            resolve: async (_query, _root, args, ctx, _info) => {
                const where = args.where ?? {};
                if (!ctx.user?.authRoles.admin) {
                    delete where.user;
                    where.userId = ctx.user?.id;
                }
                return prismaService.prisma.file.findUniqueOrThrow({
                    where: args.where,
                });
            },
        }));
        builder.queryField("readFiles", (t) => t.prismaField({
            description: "Read a list of files.",
            authScopes: { user: true },
            type: ["File"],
            args: {
                where: t.arg({ type: FileWhere }),
                distinct: t.arg({ type: [FileFields] }),
                orderBy: t.arg({ type: [FileOrderBy] }),
                paging: t.arg({ type: PagingInput }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _feedback, _args, _context, _info) => {
                subscriptions.register(`File`);
            },
            resolve: async (query, _root, args, ctx, _info) => {
                const where = args.where ?? {};
                if (!ctx.user?.authRoles.admin) {
                    delete where.user;
                    where.userId = ctx.user?.id;
                }
                return prismaService.prisma.file.findMany({
                    ...query,
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("countFiles", (t) => t.field({
            description: "Count the number of files.",
            authScopes: { user: true },
            type: "Int",
            args: {
                where: t.arg({ type: FileWhere }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _file, _args, _context, _info) => {
                subscriptions.register("File");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.file.count({
                    where: args.where ?? undefined,
                });
            },
        }));
        builder.queryField("groupFiles", (t) => t.field({
            description: "Group a list of files.",
            authScopes: { user: true },
            type: ["FileGroupBy"],
            args: {
                by: t.arg({ type: [FileFields], required: true }),
                where: t.arg({ type: FileWhere }),
                aggregate: t.arg({ type: FileAggregate }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _file, _args, _context, _info) => {
                subscriptions.register("File");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.file.groupBy({
                    by: args.by ?? [],
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? undefined,
                });
            },
        }));
    }
};
exports.FileQuery = FileQuery;
exports.FileQuery = FileQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        object_service_1.FileObject,
        query_service_1.UserQuery])
], FileQuery);
//# sourceMappingURL=query.service.js.map