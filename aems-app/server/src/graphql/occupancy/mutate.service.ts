import { Injectable } from "@nestjs/common";
import { Mutation } from "@local/common";
import { SchemaBuilderService } from "../builder.service";
import { OccupancyQuery } from "./query.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { ScheduleMutation } from "../schedule/mutate.service";
import { ConfigurationQuery } from "../configuration/query.service";

@Injectable()
@PothosMutation()
export class OccupancyMutation {
  readonly OccupancyCreate;
  readonly OccupancyUpdate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    occupancyQuery: OccupancyQuery,
    scheduleMutation: ScheduleMutation,
    configurationQuery: ConfigurationQuery,
  ) {
    const { OccupancyWhereUnique } = occupancyQuery;
    const { ScheduleCreate, ScheduleUpdate } = scheduleMutation;
    const { ConfigurationWhereUnique } = configurationQuery;

    const OccupancyScheduleCreate = builder.prismaCreateRelation("Occupancy", "schedule", {
      fields: {
        create: ScheduleCreate,
      },
    });

    const OccupancyCreateConfiguration = builder.prismaCreateRelation("Occupancy", "configuration", {
      fields: {
        connect: ConfigurationWhereUnique,
      },
    });

    this.OccupancyCreate = builder.prismaCreate("Occupancy", {
      fields: {
        stage: builder.ModelStage,
        message: "String",
        correlation: "String",
        label: "String",
        date: "DateTime",
        scheduleId: "String",
        schedule: OccupancyScheduleCreate,
        configurationId: "String",
        configuration: OccupancyCreateConfiguration,
      },
    });

    const OccupancyScheduleUpdate = builder.prismaUpdateRelation("Occupancy", "schedule", {
      fields: {
        update: ScheduleUpdate,
      },
    });

    const OccupancyUpdateConfiguration = builder.prismaUpdateRelation("Occupancy", "configuration", {
      fields: {
        connect: ConfigurationWhereUnique,
      },
    });

    this.OccupancyUpdate = builder.prismaUpdate("Occupancy", {
      fields: {
        stage: builder.ModelStage,
        message: "String",
        correlation: "String",
        label: "String",
        date: "DateTime",
        scheduleId: "String",
        schedule: OccupancyScheduleUpdate,
        configurationId: "String",
        configuration: OccupancyUpdateConfiguration,
      },
    });

    const { OccupancyCreate, OccupancyUpdate } = this;

    builder.mutationField("createOccupancy", (t) =>
      t.prismaField({
        description: "Create a new occupancy.",
        authScopes: { user: true },
        type: "Occupancy",
        args: {
          create: t.arg({ type: OccupancyCreate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.occupancy
            .create({
              ...query,
              data: { ...args.create },
            })
            .then(async (occupancy) => {
              await subscriptionService.publish("Occupancy", {
                topic: "Occupancy",
                id: occupancy.id,
                mutation: Mutation.Created,
              });
              return occupancy;
            });
        },
      }),
    );

    builder.mutationField("updateOccupancy", (t) =>
      t.prismaField({
        description: "Update the specified occupancy.",
        authScopes: { user: true },
        type: "Occupancy",
        args: {
          where: t.arg({ type: OccupancyWhereUnique, required: true }),
          update: t.arg({ type: OccupancyUpdate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.occupancy
            .update({
              ...query,
              where: args.where,
              data: args.update,
            })
            .then(async (occupancy) => {
              await subscriptionService.publish("Occupancy", {
                topic: "Occupancy",
                id: occupancy.id,
                mutation: Mutation.Updated,
              });
              await subscriptionService.publish(`Occupancy/${occupancy.id}`, {
                topic: "Occupancy",
                id: occupancy.id,
                mutation: Mutation.Updated,
              });
              return occupancy;
            });
        },
      }),
    );

    builder.mutationField("deleteOccupancy", (t) =>
      t.prismaField({
        description: "Delete the specified occupancy.",
        authScopes: { user: true },
        type: "Occupancy",
        args: {
          where: t.arg({ type: OccupancyWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.occupancy
            .delete({
              ...query,
              where: args.where,
            })
            .then(async (occupancy) => {
              await subscriptionService.publish("Occupancy", {
                topic: "Occupancy",
                id: occupancy.id,
                mutation: Mutation.Deleted,
              });
              await subscriptionService.publish(`Occupancy/${occupancy.id}`, {
                topic: "Occupancy",
                id: occupancy.id,
                mutation: Mutation.Deleted,
              });
              return occupancy;
            });
        },
      }),
    );
  }
}
