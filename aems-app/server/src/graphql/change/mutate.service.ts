import { Injectable } from "@nestjs/common";
import { Mutation } from "@local/common";
import { SchemaBuilderService } from "../builder.service";
import { ChangeQuery } from "./query.service";
import { ChangeObject } from "./object.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

@Injectable()
@PothosMutation()
export class ChangeMutation {
  readonly ChangeCreate;
  readonly ChangeUpdate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    changeQuery: ChangeQuery,
    changeObject: ChangeObject,
  ) {
    const { ChangeWhereUnique } = changeQuery;
    const { ChangeMutation } = changeObject;

    this.ChangeCreate = builder.prismaCreate("Change", {
      fields: {
        table: "String",
        key: "String",
        mutation: ChangeMutation,
        data: builder.ChangeData,
        userId: "String",
      },
    });

    this.ChangeUpdate = builder.prismaUpdate("Change", {
      fields: {
        table: "String",
        key: "String",
        mutation: ChangeMutation,
        data: builder.ChangeData,
        userId: "String",
      },
    });

    const { ChangeCreate, ChangeUpdate } = this;

    builder.mutationField("createChange", (t) =>
      t.prismaField({
        description: "Create a new change.",
        authScopes: { admin: true },
        type: "Change",
        args: {
          create: t.arg({ type: ChangeCreate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.change
            .create({
              ...query,
              data: { ...args.create },
            })
            .then(async (change) => {
              await subscriptionService.publish("Change", {
                topic: "Change",
                id: change.id,
                mutation: Mutation.Created,
              });
              return change;
            });
        },
      }),
    );

    builder.mutationField("updateChange", (t) =>
      t.prismaField({
        description: "Update the specified change.",
        authScopes: { admin: true },
        type: "Change",
        args: {
          where: t.arg({ type: ChangeWhereUnique, required: true }),
          update: t.arg({ type: ChangeUpdate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.change
            .update({
              ...query,
              where: args.where,
              data: args.update,
            })
            .then(async (change) => {
              await subscriptionService.publish("Change", {
                topic: "Change",
                id: change.id,
                mutation: Mutation.Updated,
              });
              await subscriptionService.publish(`Change/${change.id}`, {
                topic: "Change",
                id: change.id,
                mutation: Mutation.Updated,
              });
              return change;
            });
        },
      }),
    );

    builder.mutationField("deleteChange", (t) =>
      t.prismaField({
        description: "Delete the specified change.",
        authScopes: { admin: true },
        type: "Change",
        args: {
          where: t.arg({ type: ChangeWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.change
            .delete({
              ...query,
              where: args.where,
            })
            .then(async (change) => {
              await subscriptionService.publish("Change", {
                topic: "Change",
                id: change.id,
                mutation: Mutation.Deleted,
              });
              await subscriptionService.publish(`Change/${change.id}`, {
                topic: "Change",
                id: change.id,
                mutation: Mutation.Deleted,
              });
              return change;
            });
        },
      }),
    );
  }
}
