import { Injectable } from "@nestjs/common";
import { Mutation } from "@local/common";
import { SchemaBuilderService } from "../builder.service";
import { HolidayQuery } from "./query.service";
import { HolidayObject } from "./object.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

@Injectable()
@PothosMutation()
export class HolidayMutation {
  readonly HolidayCreate;
  readonly HolidayUpdate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    holidayQuery: HolidayQuery,
    holidayObject: HolidayObject,
  ) {
    const { HolidayWhereUnique } = holidayQuery;
    const { HolidayType } = holidayObject;

    this.HolidayCreate = builder.prismaCreate("Holiday", {
      fields: {
        stage: builder.ModelStage,
        message: "String",
        correlation: "String",
        type: HolidayType,
        label: "String",
        month: "Int",
        day: "Int",
        observance: "String",
      },
    });

    this.HolidayUpdate = builder.prismaUpdate("Holiday", {
      fields: {
        stage: builder.ModelStage,
        message: "String",
        correlation: "String",
        type: HolidayType,
        label: "String",
        month: "Int",
        day: "Int",
        observance: "String",
      },
    });

    const { HolidayCreate, HolidayUpdate } = this;

    builder.mutationField("createHoliday", (t) =>
      t.prismaField({
        description: "Create a new holiday.",
        authScopes: { admin: true },
        type: "Holiday",
        args: {
          create: t.arg({ type: HolidayCreate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.holiday
            .create({
              ...query,
              data: { ...args.create },
            })
            .then(async (holiday) => {
              await subscriptionService.publish("Holiday", {
                topic: "Holiday",
                id: holiday.id,
                mutation: Mutation.Created,
              });
              return holiday;
            });
        },
      }),
    );

    builder.mutationField("updateHoliday", (t) =>
      t.prismaField({
        description: "Update the specified holiday.",
        authScopes: { admin: true },
        type: "Holiday",
        args: {
          where: t.arg({ type: HolidayWhereUnique, required: true }),
          update: t.arg({ type: HolidayUpdate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.holiday
            .update({
              ...query,
              where: args.where,
              data: args.update,
            })
            .then(async (holiday) => {
              await subscriptionService.publish("Holiday", {
                topic: "Holiday",
                id: holiday.id,
                mutation: Mutation.Updated,
              });
              await subscriptionService.publish(`Holiday/${holiday.id}`, {
                topic: "Holiday",
                id: holiday.id,
                mutation: Mutation.Updated,
              });
              return holiday;
            });
        },
      }),
    );

    builder.mutationField("deleteHoliday", (t) =>
      t.prismaField({
        description: "Delete the specified holiday.",
        authScopes: { admin: true },
        type: "Holiday",
        args: {
          where: t.arg({ type: HolidayWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.holiday
            .delete({
              ...query,
              where: args.where,
            })
            .then(async (holiday) => {
              await subscriptionService.publish("Holiday", {
                topic: "Holiday",
                id: holiday.id,
                mutation: Mutation.Deleted,
              });
              await subscriptionService.publish(`Holiday/${holiday.id}`, {
                topic: "Holiday",
                id: holiday.id,
                mutation: Mutation.Deleted,
              });
              return holiday;
            });
        },
      }),
    );
  }
}
