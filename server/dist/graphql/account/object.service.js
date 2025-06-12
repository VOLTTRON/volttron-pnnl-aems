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
exports.AccountObject = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
let AccountObject = class AccountObject {
    constructor(builder) {
        this.AccountObject = builder.prismaObject("Account", {
            authScopes: { user: true },
            subscribe: (subscriptions, account, _context, _info) => {
                subscriptions.register(`Account/${account.id}`);
            },
            fields: (t) => ({
                id: t.exposeString("id"),
                type: t.exposeString("type"),
                provider: t.exposeString("provider"),
                providerAccountId: t.exposeString("providerAccountId"),
                refreshToken: t.exposeString("refreshToken", { authScopes: { admin: true }, nullable: true }),
                accessToken: t.exposeString("accessToken", { authScopes: { admin: true }, nullable: true }),
                expiresAt: t.exposeInt("expiresAt", { authScopes: { admin: true }, nullable: true }),
                tokenType: t.exposeString("tokenType", { authScopes: { admin: true }, nullable: true }),
                scope: t.exposeString("scope", { authScopes: { admin: true }, nullable: true }),
                idToken: t.exposeString("idToken", { authScopes: { admin: true }, nullable: true }),
                sessionState: t.exposeString("sessionState", { authScopes: { admin: true }, nullable: true }),
                createdAt: t.expose("createdAt", { type: builder.DateTime }),
                updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
                userId: t.exposeString("userId", { nullable: true }),
                user: t.relation("user", { nullable: true }),
            }),
        });
        this.AccountFields = builder.enumType("AccountFields", {
            values: Object.values(client_1.Prisma.AccountScalarFieldEnum),
        });
    }
};
exports.AccountObject = AccountObject;
exports.AccountObject = AccountObject = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosObject)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService])
], AccountObject);
//# sourceMappingURL=object.service.js.map