import { Injectable } from "@nestjs/common";
import { Mutation } from "@local/common";
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
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.configuration
            .create({
              ...query,
              data: { ...args.create },
            })
            .then(async (configuration) => {
              await subscriptionService.publish("Configuration", {
                topic: "Configuration",
                id: configuration.id,
                mutation: Mutation.Created,
              });
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
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.configuration
            .update({
              ...query,
              where: args.where,
              data: args.update,
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
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.configuration
            .delete({
              ...query,
              where: args.where,
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
              return configuration;
            });
        },
      }),
    );
  }
}
