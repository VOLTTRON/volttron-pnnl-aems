import { Injectable } from "@nestjs/common";
import { Mutation, StageType } from "@local/common";
import { SchemaBuilderService } from "../builder.service";
import { ConfigurationQuery } from "./query.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { SetpointMutation } from "../setpoint/mutate.service";
import { ScheduleMutation } from "../schedule/mutate.service";
import { OccupancyMutation } from "../occupancy/mutate.service";
import { OccupancyQuery } from "../occupancy/query.service";
import { HolidayMutation } from "../holiday/mutate.service";
import { HolidayQuery } from "../holiday/query.service";
import { ChangeService } from "@/change/change.service";
import { ChangeMutation } from "@prisma/client";
import { isEqual, omit } from "lodash";

@Injectable()
@PothosMutation()
export class ConfigurationMutation {
  readonly ConfigurationCreate;
  readonly ConfigurationUpdate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    configurationQuery: ConfigurationQuery,
    setpointMutation: SetpointMutation,
    scheduleMutation: ScheduleMutation,
    occupancyQuery: OccupancyQuery,
    occupancyMutation: OccupancyMutation,
    holidayQuery: HolidayQuery,
    holidayMutation: HolidayMutation,
    changeService: ChangeService,
  ) {
    const { ConfigurationWhereUnique } = configurationQuery;
    const { SetpointUpdate } = setpointMutation;
    const { ScheduleUpdate } = scheduleMutation;
    const { OccupancyWhereUnique } = occupancyQuery;
    const { OccupancyCreate } = occupancyMutation;
    const { HolidayWhereUnique } = holidayQuery;
    const { HolidayCreate } = holidayMutation;

    const ConfigurationCreateOccupancy = builder.prismaCreateRelation("Configuration", "occupancies", {
      fields: {
        create: OccupancyCreate,
      },
    });

    const ConfigurationCreateHoliday = builder.prismaCreateRelation("Configuration", "holidays", {
      fields: {
        create: HolidayCreate,
      },
    });

    this.ConfigurationCreate = builder.prismaCreate("Configuration", {
      fields: {
        stage: builder.ModelStage,
        message: "String",
        correlation: "String",
        label: "String",
        setpointId: "String",
        mondayScheduleId: "String",
        tuesdayScheduleId: "String",
        wednesdayScheduleId: "String",
        thursdayScheduleId: "String",
        fridayScheduleId: "String",
        saturdayScheduleId: "String",
        sundayScheduleId: "String",
        holidayScheduleId: "String",
        occupancies: ConfigurationCreateOccupancy,
        holidays: ConfigurationCreateHoliday,
      },
    });

    const ConfigurationUpdateSetpoint = builder.prismaUpdateRelation("Configuration", "setpoint", {
      fields: {
        update: SetpointUpdate,
      },
    });

    const ConfigurationUpdateMondaySchedule = builder.prismaUpdateRelation("Configuration", "mondaySchedule", {
      fields: {
        update: ScheduleUpdate,
      },
    });

    const ConfigurationUpdateTuesdaySchedule = builder.prismaUpdateRelation("Configuration", "tuesdaySchedule", {
      fields: {
        update: ScheduleUpdate,
      },
    });

    const ConfigurationUpdateWednesdaySchedule = builder.prismaUpdateRelation("Configuration", "wednesdaySchedule", {
      fields: {
        update: ScheduleUpdate,
      },
    });

    const ConfigurationUpdateThursdaySchedule = builder.prismaUpdateRelation("Configuration", "thursdaySchedule", {
      fields: {
        update: ScheduleUpdate,
      },
    });

    const ConfigurationUpdateFridaySchedule = builder.prismaUpdateRelation("Configuration", "fridaySchedule", {
      fields: {
        update: ScheduleUpdate,
      },
    });

    const ConfigurationUpdateSaturdaySchedule = builder.prismaUpdateRelation("Configuration", "saturdaySchedule", {
      fields: {
        update: ScheduleUpdate,
      },
    });

    const ConfigurationUpdateSundaySchedule = builder.prismaUpdateRelation("Configuration", "sundaySchedule", {
      fields: {
        update: ScheduleUpdate,
      },
    });

    const ConfigurationUpdateHolidaySchedule = builder.prismaUpdateRelation("Configuration", "holidaySchedule", {
      fields: {
        update: ScheduleUpdate,
      },
    });

    const ConfigurationUpdateOccupancies = builder.prismaUpdateRelation("Configuration", "occupancies", {
      fields: {
        connect: OccupancyWhereUnique,
        delete: OccupancyWhereUnique,
      },
    });

    const ConfigurationUpdateHoliday = builder.prismaUpdateRelation("Configuration", "holidays", {
      fields: {
        connect: HolidayWhereUnique,
        delete: HolidayWhereUnique,
      },
    });

    this.ConfigurationUpdate = builder.prismaUpdate("Configuration", {
      fields: {
        stage: builder.ModelStage,
        message: "String",
        correlation: "String",
        label: "String",
        setpointId: "String",
        setpoint: ConfigurationUpdateSetpoint,
        mondayScheduleId: "String",
        mondaySchedule: ConfigurationUpdateMondaySchedule,
        tuesdayScheduleId: "String",
        tuesdaySchedule: ConfigurationUpdateTuesdaySchedule,
        wednesdayScheduleId: "String",
        wednesdaySchedule: ConfigurationUpdateWednesdaySchedule,
        thursdayScheduleId: "String",
        thursdaySchedule: ConfigurationUpdateThursdaySchedule,
        fridayScheduleId: "String",
        fridaySchedule: ConfigurationUpdateFridaySchedule,
        saturdayScheduleId: "String",
        saturdaySchedule: ConfigurationUpdateSaturdaySchedule,
        sundayScheduleId: "String",
        sundaySchedule: ConfigurationUpdateSundaySchedule,
        holidayScheduleId: "String",
        holidaySchedule: ConfigurationUpdateHolidaySchedule,
        occupancies: ConfigurationUpdateOccupancies,
        holidays: ConfigurationUpdateHoliday,
      },
    });

    const { ConfigurationCreate, ConfigurationUpdate } = this;

    builder.mutationField("createConfiguration", (t) =>
      t.prismaField({
        description: "Create a new configuration.",
        authScopes: { admin: true },
        type: "Configuration",
        args: {
          create: t.arg({ type: ConfigurationCreate, required: true }),
        },
        resolve: async (query, _root, args, ctx, _info) => {
          return prismaService.prisma.configuration
            .create({
              ...query,
              data: { ...args.create },
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
            })
            .then(async (configuration) => {
              await subscriptionService.publish("Configuration", {
                topic: "Configuration",
                id: configuration.id,
                mutation: Mutation.Created,
              });
              if (configuration) {
                await changeService.handleChange(
                  configuration.label || `Configuration ${configuration.id}`,
                  omit(configuration, [
                    "stage",
                    "message",
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
              }
              if (configuration.setpoint) {
                await changeService.handleChange(
                  configuration.label || `Configuration ${configuration.id}`,
                  omit(configuration.setpoint, ["stage", "message"]),
                  "Setpoint",
                  ChangeMutation.Create,
                  ctx.user!,
                );
              }
              const schedules = [
                configuration.mondaySchedule,
                configuration.tuesdaySchedule,
                configuration.wednesdaySchedule,
                configuration.thursdaySchedule,
                configuration.fridaySchedule,
                configuration.saturdaySchedule,
                configuration.sundaySchedule,
                configuration.holidaySchedule,
              ];
              for (const schedule of schedules) {
                if (schedule) {
                  await changeService.handleChange(
                    configuration.label || `Configuration ${configuration.id}`,
                    omit(schedule, ["stage", "message"]),
                    "Schedule",
                    ChangeMutation.Create,
                    ctx.user!,
                  );
                }
              }
              return configuration;
            });
        },
      }),
    );

    builder.mutationField("updateConfiguration", (t) =>
      t.prismaField({
        description: "Update the specified configuration.",
        authScopes: { user: true },
        type: "Configuration",
        args: {
          where: t.arg({ type: ConfigurationWhereUnique, required: true }),
          update: t.arg({ type: ConfigurationUpdate, required: true }),
        },
        resolve: async (query, _root, args, ctx, _info) => {
          const before = await prismaService.prisma.configuration.findUnique({
            where: args.where,
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
          });
          return prismaService.prisma.configuration
            .update({
              ...query,
              where: args.where,
              data: args.update,
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
            })
            .then(async (configuration) => {
              await subscriptionService.publish("Configuration", {
                topic: "Configuration",
                id: configuration.id,
                mutation: Mutation.Updated,
              });
              await subscriptionService.publish(`Configuration/${configuration.id}`, {
                topic: "Configuration",
                id: configuration.id,
                mutation: Mutation.Updated,
              });
              if (
                configuration &&
                !isEqual(
                  omit(before, [
                    "stage",
                    "message",
                    "corelation",
                    "updatedAt",
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
                  omit(configuration, [
                    "stage",
                    "message",
                    "corelation",
                    "updatedAt",
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
                )
              ) {
                await changeService.handleChange(
                  configuration.label || `Configuration ${configuration.id}`,
                  omit(configuration, [
                    "stage",
                    "message",
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
              }
              if (
                configuration.setpoint &&
                !isEqual(
                  omit(before?.setpoint, ["stage", "message", "corelation", "updatedAt"]),
                  omit(configuration.setpoint, ["stage", "message", "corelation", "updatedAt"]),
                )
              ) {
                await changeService.handleChange(
                  configuration.label || `Configuration ${configuration.id}`,
                  omit(configuration.setpoint, ["stage", "message"]),
                  "Setpoint",
                  ChangeMutation.Update,
                  ctx.user!,
                );
              }
              const schedules = [
                { before: before?.mondaySchedule, after: configuration.mondaySchedule },
                { before: before?.tuesdaySchedule, after: configuration.tuesdaySchedule },
                { before: before?.wednesdaySchedule, after: configuration.wednesdaySchedule },
                { before: before?.thursdaySchedule, after: configuration.thursdaySchedule },
                { before: before?.fridaySchedule, after: configuration.fridaySchedule },
                { before: before?.saturdaySchedule, after: configuration.saturdaySchedule },
                { before: before?.sundaySchedule, after: configuration.sundaySchedule },
                { before: before?.holidaySchedule, after: configuration.holidaySchedule },
              ];
              for (const schedule of schedules) {
                if (
                  schedule.after &&
                  !isEqual(
                    omit(schedule.before, ["stage", "message", "corelation", "updatedAt"]),
                    omit(schedule.after, ["stage", "message", "corelation", "updatedAt"]),
                  )
                ) {
                  await changeService.handleChange(
                    configuration.label || `Configuration ${configuration.id}`,
                    omit(schedule.after, ["stage", "message"]),
                    "Schedule",
                    ChangeMutation.Update,
                    ctx.user!,
                  );
                }
              }

              // Find the unit associated with this configuration and trigger sync
              const unit = await prismaService.prisma.unit.findFirst({
                where: { configurationId: configuration.id },
              });

              if (unit && unit.stage !== StageType.Update.enum) {
                await prismaService.prisma.unit.update({
                  where: { id: unit.id },
                  data: { stage: StageType.Update.enum, message: null },
                });
              }

              return configuration;
            });
        },
      }),
    );

    builder.mutationField("deleteConfiguration", (t) =>
      t.prismaField({
        description: "Delete the specified configuration.",
        authScopes: { admin: true },
        type: "Configuration",
        args: {
          where: t.arg({ type: ConfigurationWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, ctx, _info) => {
          return prismaService.prisma.configuration
            .delete({
              ...query,
              where: args.where,
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
            })
            .then(async (configuration) => {
              await subscriptionService.publish("Configuration", {
                topic: "Configuration",
                id: configuration.id,
                mutation: Mutation.Deleted,
              });
              await subscriptionService.publish(`Configuration/${configuration.id}`, {
                topic: "Configuration",
                id: configuration.id,
                mutation: Mutation.Deleted,
              });
              if (configuration) {
                await changeService.handleChange(
                  configuration.label || `Configuration ${configuration.id}`,
                  omit(configuration, [
                    "stage",
                    "message",
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
              }
              if (configuration.setpoint) {
                await changeService.handleChange(
                  configuration.label || `Configuration ${configuration.id}`,
                  omit(configuration.setpoint, ["stage", "message"]),
                  "Setpoint",
                  ChangeMutation.Delete,
                  ctx.user!,
                );
              }
              const schedules = [
                configuration.mondaySchedule,
                configuration.tuesdaySchedule,
                configuration.wednesdaySchedule,
                configuration.thursdaySchedule,
                configuration.fridaySchedule,
                configuration.saturdaySchedule,
                configuration.sundaySchedule,
                configuration.holidaySchedule,
              ];
              for (const schedule of schedules) {
                if (schedule) {
                  await changeService.handleChange(
                    configuration.label || `Configuration ${configuration.id}`,
                    omit(schedule, ["stage", "message"]),
                    "Schedule",
                    ChangeMutation.Delete,
                    ctx.user!,
                  );
                }
              }
              return configuration;
            });
        },
      }),
    );
  }
}
