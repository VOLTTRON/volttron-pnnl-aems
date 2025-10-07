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
exports.ConfigurationObject = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
let ConfigurationObject = class ConfigurationObject {
    constructor(builder) {
        this.ConfigurationObject = builder.prismaObject("Configuration", {
            authScopes: { user: true },
            subscribe(subscriptions, parent, _context, _info) {
                subscriptions.register(`Configuration/${parent.id}`);
            },
            fields: (t) => ({
                id: t.exposeString("id"),
                stage: t.expose("stage", { type: builder.ModelStage }),
                message: t.exposeString("message", { nullable: true }),
                correlation: t.exposeString("correlation", { nullable: true }),
                createdAt: t.expose("createdAt", { type: builder.DateTime }),
                updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
                label: t.exposeString("label"),
                setpointId: t.exposeString("setpointId", { nullable: true }),
                mondayScheduleId: t.exposeString("mondayScheduleId", { nullable: true }),
                tuesdayScheduleId: t.exposeString("tuesdayScheduleId", { nullable: true }),
                wednesdayScheduleId: t.exposeString("wednesdayScheduleId", { nullable: true }),
                thursdayScheduleId: t.exposeString("thursdayScheduleId", { nullable: true }),
                fridayScheduleId: t.exposeString("fridayScheduleId", { nullable: true }),
                saturdayScheduleId: t.exposeString("saturdayScheduleId", { nullable: true }),
                sundayScheduleId: t.exposeString("sundayScheduleId", { nullable: true }),
                holidayScheduleId: t.exposeString("holidayScheduleId", { nullable: true }),
                setpoint: t.relation("setpoint", { nullable: true }),
                mondaySchedule: t.relation("mondaySchedule", { nullable: true }),
                tuesdaySchedule: t.relation("tuesdaySchedule", { nullable: true }),
                wednesdaySchedule: t.relation("wednesdaySchedule", { nullable: true }),
                thursdaySchedule: t.relation("thursdaySchedule", { nullable: true }),
                fridaySchedule: t.relation("fridaySchedule", { nullable: true }),
                saturdaySchedule: t.relation("saturdaySchedule", { nullable: true }),
                sundaySchedule: t.relation("sundaySchedule", { nullable: true }),
                holidaySchedule: t.relation("holidaySchedule", { nullable: true }),
                units: t.relation("units"),
                occupancies: t.relation("occupancies"),
                holidays: t.relation("holidays"),
            }),
        });
        this.ConfigurationFields = builder.enumType("ConfigurationFields", {
            values: Object.values(client_1.Prisma.ConfigurationScalarFieldEnum),
        });
    }
};
exports.ConfigurationObject = ConfigurationObject;
exports.ConfigurationObject = ConfigurationObject = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosObject)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService])
], ConfigurationObject);
//# sourceMappingURL=object.service.js.map