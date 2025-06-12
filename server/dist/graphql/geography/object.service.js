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
exports.GeographyObject = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
let GeographyObject = class GeographyObject {
    constructor(builder) {
        this.GeographyObject = builder.prismaObject("Geography", {
            authScopes: { user: true },
            subscribe: (subscriptions, geography, _context, _info) => {
                subscriptions.register(`Geography/${geography.id}`);
            },
            fields: (t) => ({
                id: t.exposeString("id", { nullable: true }),
                name: t.exposeString("name", { nullable: true }),
                group: t.exposeString("group", { nullable: true }),
                type: t.exposeString("type", { nullable: true }),
                geojson: t.expose("geojson", { type: builder.GeographyGeoJson }),
                createdAt: t.expose("createdAt", { type: builder.DateTime, nullable: true }),
                updatedAt: t.expose("updatedAt", { type: builder.DateTime, nullable: true }),
            }),
        });
        this.GeographyFields = builder.enumType("GeographyFields", {
            values: Object.values(client_1.Prisma.GeographyScalarFieldEnum),
        });
    }
};
exports.GeographyObject = GeographyObject;
exports.GeographyObject = GeographyObject = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosObject)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService])
], GeographyObject);
//# sourceMappingURL=object.service.js.map