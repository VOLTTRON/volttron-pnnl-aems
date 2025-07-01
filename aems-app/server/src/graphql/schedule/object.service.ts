import { Prisma, ModelStage } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class ScheduleObject {
  readonly ScheduleObject;
  readonly ScheduleFields;
  readonly ModelStage;

  constructor(builder: SchemaBuilderService) {
    // Define the ModelStage enum
    this.ModelStage = builder.enumType("ModelStage", {
      values: Object.values(ModelStage),
    });

    this.ScheduleObject = builder.prismaObject("Schedule", {
      authScopes: { admin: true },
      subscribe(subscriptions, parent, _context, _info) {
        subscriptions.register(`Schedule/${parent.id}`);
      },
      fields: (t) => ({
        // key
        id: t.exposeString("id"),
        // metadata
        stage: t.expose("stage", { type: this.ModelStage }),
        message: t.exposeString("message", { nullable: true }),
        correlation: t.exposeString("correlation", { nullable: true }),
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
        // fields
        label: t.exposeString("label"),
        startTime: t.exposeString("startTime"),
        endTime: t.exposeString("endTime"),
        occupied: t.exposeBoolean("occupied"),
        // foreign keys
        setpointId: t.exposeString("setpointId", { nullable: true }),
        // direct relations
        setpoint: t.relation("setpoint", { nullable: true }),
        // indirect relations
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
      values: Object.values(Prisma.ScheduleScalarFieldEnum),
    });
  }
}
