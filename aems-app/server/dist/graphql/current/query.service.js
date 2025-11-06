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
exports.CurrentQuery = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
let CurrentQuery = class CurrentQuery {
    constructor(builder, prismaService) {
        builder.queryField("readCurrent", (t) => t.prismaField({
            description: "Read the currently logged in user.",
            type: "User",
            nullable: true,
            smartSubscription: true,
            subscribe: (subscriptions, _parent, _args, ctx, _info) => {
                if (ctx.user?.id) {
                    subscriptions.register(`User/${ctx.user.id}`);
                }
            },
            resolve: async (query, _root, args, ctx, _info) => {
                if (!ctx.user?.id) {
                    return Promise.resolve(null);
                }
                return prismaService.prisma.user.findUniqueOrThrow({
                    ...query,
                    ...args,
                    where: { id: ctx.user.id },
                });
            },
        }));
    }
};
exports.CurrentQuery = CurrentQuery;
exports.CurrentQuery = CurrentQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService, prisma_service_1.PrismaService])
], CurrentQuery);
//# sourceMappingURL=query.service.js.map