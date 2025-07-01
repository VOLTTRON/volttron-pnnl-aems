import { Prisma, ModelStage } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class ConfigurationObject {
  readonly ConfigurationObject;
  readonly ConfigurationFields;
  readonly ModelStage;

  constructor(builder: SchemaBuilderService) {
    // Define the ModelStage enum
    this.ModelStage = builder.enumType("ModelStage", {
      values: Object.values(ModelStage),
    });

    this.ConfigurationObject = builder.prismaObject("Configuration", {
      authScopes: { admin: true },
      subscribe(subscriptions, parent, _context, _info) {
        subscriptions.register(`Configuration/${parent.id}`);
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
        // foreign keys
        setpointId: t.exposeString("setpointId", { nullable: true }),
        mondayScheduleId: t.exposeString("mondayScheduleId", { nullable: true }),
        tuesdayScheduleId: t.exposeString("tuesdayScheduleId", { nullable: true }),
        wednesdayScheduleId: t.exposeString("wednesdayScheduleId", { nullable: true }),
        thursdayScheduleId: t.exposeString("thursdayScheduleId", { nullable: true }),
        fridayScheduleId: t.exposeString("fridayScheduleId", { nullable: true }),
        saturdayScheduleId: t.exposeString("saturdayScheduleId", { nullable: true }),
        sundayScheduleId: t.exposeString("sundayScheduleId", { nullable: true }),
        holidayScheduleId: t.exposeString("holidayScheduleId", { nullable: true }),
        // direct relations
        setpoint: t.relation("setpoint", { nullable: true }),
        mondaySchedule: t.relation("mondaySchedule", { nullable: true }),
        tuesdaySchedule: t.relation("tuesdaySchedule", { nullable: true }),
        wednesdaySchedule: t.relation("wednesdaySchedule", { nullable: true }),
        thursdaySchedule: t.relation("thursdaySchedule", { nullable: true }),
        fridaySchedule: t.relation("fridaySchedule", { nullable: true }),
        saturdaySchedule: t.relation("saturdaySchedule", { nullable: true }),
        sundaySchedule: t.relation("sundaySchedule", { nullable: true }),
        holidaySchedule: t.relation("holidaySchedule", { nullable: true }),
        // indirect relations
        units: t.relation("units"),
        occupancies: t.relation("occupancies"),
        holidays: t.relation("holidays"),
      }),
    });

    this.ConfigurationFields = builder.enumType("ConfigurationFields", {
      values: Object.values(Prisma.ConfigurationScalarFieldEnum),
    });
  }
}
