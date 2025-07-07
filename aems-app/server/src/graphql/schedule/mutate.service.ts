import { Injectable } from "@nestjs/common";
import { Mutation } from "@local/common";
import { SchemaBuilderService } from "../builder.service";
import { ScheduleQuery } from "./query.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

@Injectable()
@PothosMutation()
export class ScheduleMutation {
  readonly ScheduleCreate;
  readonly ScheduleUpdate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    scheduleQuery: ScheduleQuery,
  ) {
    const { ScheduleWhereUnique } = scheduleQuery;

    this.ScheduleCreate = builder.prismaCreate("Schedule", {
      fields: {
        stage: builder.ModelStage,
        message: "String",
        correlation: "String",
        label: "String",
        startTime: "String",
        endTime: "String",
        occupied: "Boolean",
        setpointId: "String",
      },
    });

    this.ScheduleUpdate = builder.prismaUpdate("Schedule", {
      fields: {
        stage: builder.ModelStage,
        message: "String",
        correlation: "String",
        label: "String",
        startTime: "String",
        endTime: "String",
        occupied: "Boolean",
        setpointId: "String",
      },
    });

    const { ScheduleCreate, ScheduleUpdate } = this;

    builder.mutationField("createSchedule", (t) =>
      t.prismaField({
        description: "Create a new schedule.",
        authScopes: { admin: true },
        type: "Schedule",
        args: {
          create: t.arg({ type: ScheduleCreate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.schedule
            .create({
              ...query,
              data: { ...args.create },
            })
            .then(async (schedule) => {
              await subscriptionService.publish("Schedule", {
                topic: "Schedule",
                id: schedule.id,
                mutation: Mutation.Created,
              });
              return schedule;
            });
        },
      }),
    );

    builder.mutationField("updateSchedule", (t) =>
      t.prismaField({
        description: "Update the specified schedule.",
        authScopes: { admin: true },
        type: "Schedule",
        args: {
          where: t.arg({ type: ScheduleWhereUnique, required: true }),
          update: t.arg({ type: ScheduleUpdate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.schedule
            .update({
              ...query,
              where: args.where,
              data: args.update,
            })
            .then(async (schedule) => {
              await subscriptionService.publish("Schedule", {
                topic: "Schedule",
                id: schedule.id,
                mutation: Mutation.Updated,
              });
              await subscriptionService.publish(`Schedule/${schedule.id}`, {
                topic: "Schedule",
                id: schedule.id,
                mutation: Mutation.Updated,
              });
              return schedule;
            });
        },
      }),
    );

    builder.mutationField("deleteSchedule", (t) =>
      t.prismaField({
        description: "Delete the specified schedule.",
        authScopes: { admin: true },
        type: "Schedule",
        args: {
          where: t.arg({ type: ScheduleWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.schedule
            .delete({
              ...query,
              where: args.where,
            })
            .then(async (schedule) => {
              await subscriptionService.publish("Schedule", {
                topic: "Schedule",
                id: schedule.id,
                mutation: Mutation.Deleted,
              });
              await subscriptionService.publish(`Schedule/${schedule.id}`, {
                topic: "Schedule",
                id: schedule.id,
                mutation: Mutation.Deleted,
              });
              return schedule;
            });
        },
      }),
    );
  }
}
