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
exports.BannerObject = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
let BannerObject = class BannerObject {
    constructor(builder) {
        this.BannerObject = builder.prismaObject("Banner", {
            authScopes: { user: true },
            subscribe: (subscriptions, banner, _context, _info) => {
                subscriptions.register(`Banner/${banner.id}`);
            },
            fields: (t) => ({
                id: t.exposeString("id", {}),
                message: t.exposeString("message", { nullable: true }),
                expiration: t.expose("expiration", { type: builder.DateTime, nullable: true }),
                createdAt: t.expose("createdAt", { type: builder.DateTime }),
                updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
                users: t.relation("users", { authScopes: { admin: true }, nullable: true }),
            }),
        });
        this.BannerFields = builder.enumType("BannerFields", {
            values: Object.values(client_1.Prisma.BannerScalarFieldEnum),
        });
    }
};
exports.BannerObject = BannerObject;
exports.BannerObject = BannerObject = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosObject)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService])
], BannerObject);
//# sourceMappingURL=object.service.js.map