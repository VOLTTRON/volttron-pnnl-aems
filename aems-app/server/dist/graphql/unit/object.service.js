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
exports.UnitObject = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
let UnitObject = class UnitObject {
    constructor(builder) {
        this.UnitObject = builder.prismaObject("Unit", {
            authScopes: { user: true },
            subscribe(subscriptions, parent, _context, _info) {
                subscriptions.register(`Unit/${parent.id}`);
            },
            fields: (t) => ({
                id: t.exposeString("id"),
                stage: t.expose("stage", { type: builder.ModelStage }),
                message: t.exposeString("message", { nullable: true }),
                correlation: t.exposeString("correlation", { nullable: true }),
                createdAt: t.expose("createdAt", { type: builder.DateTime }),
                updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
                name: t.exposeString("name"),
                campus: t.exposeString("campus"),
                building: t.exposeString("building"),
                system: t.exposeString("system"),
                timezone: t.exposeString("timezone"),
                label: t.exposeString("label"),
                coolingCapacity: t.exposeFloat("coolingCapacity"),
                compressors: t.exposeInt("compressors"),
                coolingLockout: t.exposeFloat("coolingLockout"),
                optimalStartLockout: t.exposeFloat("optimalStartLockout"),
                optimalStartDeviation: t.exposeFloat("optimalStartDeviation"),
                earliestStart: t.exposeInt("earliestStart"),
                latestStart: t.exposeInt("latestStart"),
                zoneLocation: t.exposeString("zoneLocation"),
                zoneMass: t.exposeString("zoneMass"),
                zoneOrientation: t.exposeString("zoneOrientation"),
                zoneBuilding: t.exposeString("zoneBuilding"),
                heatPump: t.exposeBoolean("heatPump"),
                heatPumpBackup: t.exposeFloat("heatPumpBackup"),
                economizer: t.exposeBoolean("economizer"),
                heatPumpLockout: t.exposeFloat("heatPumpLockout"),
                coolingPeakOffset: t.exposeFloat("coolingPeakOffset"),
                heatingPeakOffset: t.exposeFloat("heatingPeakOffset"),
                peakLoadExclude: t.exposeBoolean("peakLoadExclude"),
                economizerSetpoint: t.exposeFloat("economizerSetpoint"),
                occupancyDetection: t.exposeBoolean("occupancyDetection"),
                configurationId: t.exposeString("configurationId", { nullable: true }),
                controlId: t.exposeString("controlId", { nullable: true }),
                locationId: t.exposeString("locationId", { nullable: true }),
                configuration: t.relation("configuration", { nullable: true }),
                control: t.relation("control", { nullable: true }),
                location: t.relation("location", { nullable: true }),
                users: t.relation("users"),
            }),
        });
        this.UnitFields = builder.enumType("UnitFields", {
            values: Object.values(client_1.Prisma.UnitScalarFieldEnum),
        });
    }
};
exports.UnitObject = UnitObject;
exports.UnitObject = UnitObject = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosObject)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService])
], UnitObject);
//# sourceMappingURL=object.service.js.map