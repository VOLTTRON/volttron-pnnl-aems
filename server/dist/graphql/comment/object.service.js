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
exports.CommentObject = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
let CommentObject = class CommentObject {
    constructor(builder) {
        this.CommentObject = builder.prismaObject("Comment", {
            authScopes: { user: true },
            subscribe: (subscriptions, comment, _context, _info) => {
                subscriptions.register(`Comment/${comment.id}`);
            },
            fields: (t) => ({
                id: t.exposeString("id"),
                message: t.exposeString("message"),
                createdAt: t.expose("createdAt", { type: builder.DateTime }),
                updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
                userId: t.exposeString("userId", { nullable: true }),
                user: t.relation("user", { nullable: true }),
            }),
        });
        this.CommentFields = builder.enumType("CommentFields", {
            values: Object.values(client_1.Prisma.CommentScalarFieldEnum),
        });
    }
};
exports.CommentObject = CommentObject;
exports.CommentObject = CommentObject = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosObject)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService])
], CommentObject);
//# sourceMappingURL=object.service.js.map