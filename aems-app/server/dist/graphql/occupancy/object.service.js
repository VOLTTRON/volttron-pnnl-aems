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
exports.OccupancyObject = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
let OccupancyObject = class OccupancyObject {
    constructor(builder) {
        this.OccupancyObject = builder.prismaObject("Occupancy", {
            authScopes: { user: true },
            subscribe(subscriptions, parent, _context, _info) {
                subscriptions.register(`Occupancy/${parent.id}`);
            },
            fields: (t) => ({
                id: t.exposeString("id"),
                stage: t.expose("stage", { type: builder.ModelStage }),
                message: t.exposeString("message", { nullable: true }),
                correlation: t.exposeString("correlation", { nullable: true }),
                createdAt: t.expose("createdAt", { type: builder.DateTime }),
                updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
                label: t.exposeString("label"),
                date: t.expose("date", { type: builder.DateTime }),
                scheduleId: t.exposeString("scheduleId", { nullable: true }),
                configurationId: t.exposeString("configurationId", { nullable: true }),
                schedule: t.relation("schedule", { nullable: true }),
                configuration: t.relation("configuration", { nullable: true }),
            }),
        });
        this.OccupancyFields = builder.enumType("OccupancyFields", {
            values: Object.values(client_1.Prisma.OccupancyScalarFieldEnum),
        });
    }
};
exports.OccupancyObject = OccupancyObject;
exports.OccupancyObject = OccupancyObject = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosObject)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService])
], OccupancyObject);
//# sourceMappingURL=object.service.js.map