import { Injectable } from "@nestjs/common";
import { Mutation } from "@local/common";
import { SchemaBuilderService } from "../builder.service";
import { UnitQuery } from "./query.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { ConfigurationMutation } from "../configuration/mutate.service";
import { ControlMutation } from "../control/mutate.service";
import { LocationMutation } from "../location/mutate.service";
import { ChangeService } from "@/change/change.service";
import { ChangeMutation } from "@prisma/client";
import { omit } from "lodash";

@Injectable()
@PothosMutation()
export class UnitMutation {
  readonly UnitCreate;
  readonly UnitUpdate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    unitQuery: UnitQuery,
    configurationMutation: ConfigurationMutation,
    controlMutation: ControlMutation,
    locationMutation: LocationMutation,
    changeService: ChangeService,
  ) {
    const { UnitWhereUnique } = unitQuery;
    const { ConfigurationUpdate } = configurationMutation;
    const { ControlUpdate } = controlMutation;
    const { LocationUpdate } = locationMutation;

    this.UnitCreate = builder.prismaCreate("Unit", {
      fields: {
        stage: builder.ModelStage,
        message: "String",
        correlation: "String",
        name: "String",
        campus: "String",
        building: "String",
        system: "String",
        timezone: "String",
        label: "String",
        coolingCapacity: "Float",
        compressors: "Int",
        coolingLockout: "Float",
        optimalStartLockout: "Float",
        optimalStartDeviation: "Float",
        earliestStart: "Int",
        latestStart: "Int",
        zoneLocation: "String",
        zoneMass: "String",
        zoneOrientation: "String",
        zoneBuilding: "String",
        heatPump: "Boolean",
        heatPumpBackup: "Float",
        economizer: "Boolean",
        heatPumpLockout: "Float",
        coolingPeakOffset: "Float",
        heatingPeakOffset: "Float",
        peakLoadExclude: "Boolean",
        economizerSetpoint: "Float",
        configurationId: "String",
        controlId: "String",
        locationId: "String",
      },
    });

    const UnitUpdateConfiguration = builder.prismaUpdateRelation("Unit", "configuration", {
      fields: {
        update: ConfigurationUpdate,
      },
    });

    const UnitUpdateControl = builder.prismaUpdateRelation("Unit", "control", {
      fields: {
        update: ControlUpdate,
      },
    });

    const UnitUpdateLocation = builder.prismaUpdateRelation("Unit", "location", {
      fields: {
        update: LocationUpdate,
      },
    });

    this.UnitUpdate = builder.prismaUpdate("Unit", {
      fields: {
        stage: builder.ModelStage,
        message: "String",
        correlation: "String",
        name: "String",
        campus: "String",
        building: "String",
        system: "String",
        timezone: "String",
        label: "String",
        coolingCapacity: "Float",
        compressors: "Int",
        coolingLockout: "Float",
        optimalStartLockout: "Float",
        optimalStartDeviation: "Float",
        earliestStart: "Int",
        latestStart: "Int",
        zoneLocation: "String",
        zoneMass: "String",
        zoneOrientation: "String",
        zoneBuilding: "String",
        heatPump: "Boolean",
        heatPumpBackup: "Float",
        economizer: "Boolean",
        heatPumpLockout: "Float",
        coolingPeakOffset: "Float",
        heatingPeakOffset: "Float",
        peakLoadExclude: "Boolean",
        economizerSetpoint: "Float",
        configurationId: "String",
        configuration: UnitUpdateConfiguration,
        controlId: "String",
        control: UnitUpdateControl,
        locationId: "String",
        location: UnitUpdateLocation,
      },
    });

    const { UnitCreate, UnitUpdate } = this;

    builder.mutationField("createUnit", (t) =>
      t.prismaField({
        description: "Create a new unit.",
        authScopes: { admin: true },
        type: "Unit",
        args: {
          create: t.arg({ type: UnitCreate, required: true }),
        },
        resolve: async (query, _root, args, ctx, _info) => {
          return prismaService.prisma.unit
            .create({
              ...query,
              data: { ...args.create },
              include: {
                configuration: {
                  include: {
                    setpoint: true,
                    mondaySchedule: true,
                    tuesdaySchedule: true,
                    wednesdaySchedule: true,
                    thursdaySchedule: true,
                    fridaySchedule: true,
                    saturdaySchedule: true,
                    sundaySchedule: true,
                    holidaySchedule: true,
                  },
                },
                control: true,
                location: true,
              },
            })
            .then(async (unit) => {
              await subscriptionService.publish("Unit", { topic: "Unit", id: unit.id, mutation: Mutation.Created });
              await changeService.handleChange(
                omit(unit, ["configuration", "control", "location"]),
                "Unit",
                ChangeMutation.Create,
                ctx.user!,
              );
              if (unit.configuration) {
                await changeService.handleChange(
                  omit(unit.configuration, [
                    "setpoint",
                    "mondaySchedule",
                    "tuesdaySchedule",
                    "wednesdaySchedule",
                    "thursdaySchedule",
                    "fridaySchedule",
                    "saturdaySchedule",
                    "sundaySchedule",
                    "holidaySchedule",
                  ]),
                  "Configuration",
                  ChangeMutation.Create,
                  ctx.user!,
                );
                if (unit.configuration.setpoint) {
                  await changeService.handleChange(
                    unit.configuration.setpoint,
                    "Setpoint",
                    ChangeMutation.Create,
                    ctx.user!,
                  );
                }
                const schedules = [
                  unit.configuration.mondaySchedule,
                  unit.configuration.tuesdaySchedule,
                  unit.configuration.wednesdaySchedule,
                  unit.configuration.thursdaySchedule,
                  unit.configuration.fridaySchedule,
                  unit.configuration.saturdaySchedule,
                  unit.configuration.sundaySchedule,
                  unit.configuration.holidaySchedule,
                ];
                for (const schedule of schedules) {
                  if (schedule) {
                    await changeService.handleChange(schedule, "Schedule", ChangeMutation.Create, ctx.user!);
                  }
                }
              }
              if (unit.control) {
                await changeService.handleChange(unit.control, "Control", ChangeMutation.Create, ctx.user!);
              }
              if (unit.location) {
                await changeService.handleChange(unit.location, "Location", ChangeMutation.Create, ctx.user!);
              }
              return unit;
            });
        },
      }),
    );

    builder.mutationField("updateUnit", (t) =>
      t.prismaField({
        description: "Update the specified unit.",
        authScopes: { user: true },
        type: "Unit",
        args: {
          where: t.arg({ type: UnitWhereUnique, required: true }),
          update: t.arg({ type: UnitUpdate, required: true }),
        },
        resolve: async (query, _root, args, ctx, _info) => {
          return prismaService.prisma.unit
            .update({
              ...query,
              where: args.where,
              data: args.update,
              include: {
                configuration: {
                  include: {
                    setpoint: true,
                    mondaySchedule: true,
                    tuesdaySchedule: true,
                    wednesdaySchedule: true,
                    thursdaySchedule: true,
                    fridaySchedule: true,
                    saturdaySchedule: true,
                    sundaySchedule: true,
                    holidaySchedule: true,
                  },
                },
                control: true,
                location: true,
              },
            })
            .then(async (unit) => {
              await subscriptionService.publish("Unit", { topic: "Unit", id: unit.id, mutation: Mutation.Updated });
              await subscriptionService.publish(`Unit/${unit.id}`, {
                topic: "Unit",
                id: unit.id,
                mutation: Mutation.Updated,
              });
              await changeService.handleChange(
                omit(unit, ["configuration", "control", "location"]),
                "Unit",
                ChangeMutation.Update,
                ctx.user!,
              );
              if (unit.configuration) {
                await changeService.handleChange(
                  omit(unit.configuration, [
                    "setpoint",
                    "mondaySchedule",
                    "tuesdaySchedule",
                    "wednesdaySchedule",
                    "thursdaySchedule",
                    "fridaySchedule",
                    "saturdaySchedule",
                    "sundaySchedule",
                    "holidaySchedule",
                  ]),
                  "Configuration",
                  ChangeMutation.Update,
                  ctx.user!,
                );
                if (unit.configuration.setpoint) {
                  await changeService.handleChange(
                    unit.configuration.setpoint,
                    "Setpoint",
                    ChangeMutation.Update,
                    ctx.user!,
                  );
                }
                const schedules = [
                  unit.configuration.mondaySchedule,
                  unit.configuration.tuesdaySchedule,
                  unit.configuration.wednesdaySchedule,
                  unit.configuration.thursdaySchedule,
                  unit.configuration.fridaySchedule,
                  unit.configuration.saturdaySchedule,
                  unit.configuration.sundaySchedule,
                  unit.configuration.holidaySchedule,
                ];
                for (const schedule of schedules) {
                  if (schedule) {
                    await changeService.handleChange(schedule, "Schedule", ChangeMutation.Update, ctx.user!);
                  }
                }
              }
              if (unit.control) {
                await changeService.handleChange(unit.control, "Control", ChangeMutation.Update, ctx.user!);
              }
              if (unit.location) {
                await changeService.handleChange(unit.location, "Location", ChangeMutation.Update, ctx.user!);
              }
              return unit;
            });
        },
      }),
    );

    builder.mutationField("deleteUnit", (t) =>
      t.prismaField({
        description: "Delete the specified unit.",
        authScopes: { admin: true },
        type: "Unit",
        args: {
          where: t.arg({ type: UnitWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, ctx, _info) => {
          return prismaService.prisma.unit
            .delete({
              ...query,
              where: args.where,
              include: {
                configuration: {
                  include: {
                    setpoint: true,
                    mondaySchedule: true,
                    tuesdaySchedule: true,
                    wednesdaySchedule: true,
                    thursdaySchedule: true,
                    fridaySchedule: true,
                    saturdaySchedule: true,
                    sundaySchedule: true,
                    holidaySchedule: true,
                  },
                },
                control: true,
                location: true,
              },
            })
            .then(async (unit) => {
              await subscriptionService.publish("Unit", { topic: "Unit", id: unit.id, mutation: Mutation.Deleted });
              await subscriptionService.publish(`Unit/${unit.id}`, {
                topic: "Unit",
                id: unit.id,
                mutation: Mutation.Deleted,
              });
              await changeService.handleChange(
                omit(unit, ["configuration", "control", "location"]),
                "Unit",
                ChangeMutation.Delete,
                ctx.user!,
              );
              if (unit.configuration) {
                await changeService.handleChange(
                  omit(unit.configuration, [
                    "setpoint",
                    "mondaySchedule",
                    "tuesdaySchedule",
                    "wednesdaySchedule",
                    "thursdaySchedule",
                    "fridaySchedule",
                    "saturdaySchedule",
                    "sundaySchedule",
                    "holidaySchedule",
                  ]),
                  "Configuration",
                  ChangeMutation.Delete,
                  ctx.user!,
                );
                if (unit.configuration.setpoint) {
                  await changeService.handleChange(
                    unit.configuration.setpoint,
                    "Setpoint",
                    ChangeMutation.Delete,
                    ctx.user!,
                  );
                }
                const schedules = [
                  unit.configuration.mondaySchedule,
                  unit.configuration.tuesdaySchedule,
                  unit.configuration.wednesdaySchedule,
                  unit.configuration.thursdaySchedule,
                  unit.configuration.fridaySchedule,
                  unit.configuration.saturdaySchedule,
                  unit.configuration.sundaySchedule,
                  unit.configuration.holidaySchedule,
                ];
                for (const schedule of schedules) {
                  if (schedule) {
                    await changeService.handleChange(schedule, "Schedule", ChangeMutation.Delete, ctx.user!);
                  }
                }
              }
              if (unit.control) {
                await changeService.handleChange(unit.control, "Control", ChangeMutation.Delete, ctx.user!);
              }
              if (unit.location) {
                await changeService.handleChange(unit.location, "Location", ChangeMutation.Delete, ctx.user!);
              }
              return unit;
            });
        },
      }),
    );
  }
}
