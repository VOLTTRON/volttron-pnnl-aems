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
exports.ScheduleObject = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
let ScheduleObject = class ScheduleObject {
    constructor(builder) {
        this.ScheduleObject = builder.prismaObject("Schedule", {
            authScopes: { user: true },
            subscribe(subscriptions, parent, _context, _info) {
                subscriptions.register(`Schedule/${parent.id}`);
            },
            fields: (t) => ({
                id: t.exposeString("id"),
                stage: t.expose("stage", { type: builder.ModelStage }),
                message: t.exposeString("message", { nullable: true }),
                correlation: t.exposeString("correlation", { nullable: true }),
                createdAt: t.expose("createdAt", { type: builder.DateTime }),
                updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
                label: t.exposeString("label"),
                startTime: t.exposeString("startTime"),
                endTime: t.exposeString("endTime"),
                occupied: t.exposeBoolean("occupied"),
                setpointId: t.exposeString("setpointId", { nullable: true }),
                setpoint: t.relation("setpoint", { nullable: true }),
                mondayConfigurations: t.relation("mondayConfigurations"),
                tuesdayConfigurations: t.relation("tuesdayConfigurations"),
                wednesdayConfigurations: t.relation("wednesdayConfigurations"),
                thursdayConfigurations: t.relation("thursdayConfigurations"),
                fridayConfigurations: t.relation("fridayConfigurations"),
                saturdayConfigurations: t.relation("saturdayConfigurations"),
                sundayConfigurations: t.relation("sundayConfigurations"),
                holidayConfigurations: t.relation("holidayConfigurations"),
                occupancies: t.relation("occupancies"),
            }),
        });
        this.ScheduleFields = builder.enumType("ScheduleFields", {
            values: Object.values(client_1.Prisma.ScheduleScalarFieldEnum),
        });
    }
};
exports.ScheduleObject = ScheduleObject;
exports.ScheduleObject = ScheduleObject = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosObject)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService])
], ScheduleObject);
//# sourceMappingURL=object.service.js.map