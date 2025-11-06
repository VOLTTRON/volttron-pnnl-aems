import { Prisma } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class UnitObject {
  readonly UnitObject;
  readonly UnitFields;

  constructor(builder: SchemaBuilderService) {
    this.UnitObject = builder.prismaObject("Unit", {
      authScopes: { user: true },
      subscribe(subscriptions, parent, _context, _info) {
        subscriptions.register(`Unit/${parent.id}`);
      },
      fields: (t) => ({
        // key
        id: t.exposeString("id"),
        // metadata
        stage: t.expose("stage", { type: builder.ModelStage }),
        message: t.exposeString("message", { nullable: true }),
        correlation: t.exposeString("correlation", { nullable: true }),
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
        // fields
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
        // foreign keys
        configurationId: t.exposeString("configurationId", { nullable: true }),
        controlId: t.exposeString("controlId", { nullable: true }),
        locationId: t.exposeString("locationId", { nullable: true }),
        // direct relations
        configuration: t.relation("configuration", { nullable: true }),
        control: t.relation("control", { nullable: true }),
        location: t.relation("location", { nullable: true }),
        // indirect relations
        users: t.relation("users"),
      }),
    });

    this.UnitFields = builder.enumType("UnitFields", {
      values: Object.values(Prisma.UnitScalarFieldEnum),
    });
  }
}
