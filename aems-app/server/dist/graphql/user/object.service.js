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
exports.UserObject = void 0;
const client_1 = require("@prisma/client");
const lodash_1 = require("lodash");
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
const graphql_1 = require("graphql");
let UserObject = class UserObject {
    constructor(builder) {
        this.UserPreferences = builder.addScalarType("UserPreferences", new graphql_1.GraphQLScalarType({
            name: "UserPreferences",
        }));
        this.UserObject = builder.prismaObject("User", {
            authScopes: { user: true },
            subscribe(subscriptions, parent, _context, _info) {
                subscriptions.register(`User/${parent.id}`);
            },
            fields: (t) => ({
                id: t.exposeString("id"),
                name: t.exposeString("name", { nullable: true }),
                email: t.exposeString("email"),
                image: t.exposeString("image", { nullable: true }),
                emailVerified: t.expose("emailVerified", { type: builder.DateTime, nullable: true }),
                role: t.exposeString("role", { nullable: true }),
                preferences: t.expose("preferences", { type: this.UserPreferences, nullable: true }),
                createdAt: t.expose("createdAt", { type: builder.DateTime }),
                updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
                comments: t.relation("comments", { nullable: true }),
                accounts: t.relation("accounts", { nullable: true }),
                banners: t.relation("banners", { nullable: true }),
            }),
        });
        this.UserFields = builder.enumType("UserFields", {
            values: Object.values((0, lodash_1.omit)(client_1.Prisma.UserScalarFieldEnum, "password")),
        });
    }
};
exports.UserObject = UserObject;
exports.UserObject = UserObject = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosObject)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService])
], UserObject);
//# sourceMappingURL=object.service.js.map