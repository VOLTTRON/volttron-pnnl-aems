import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { Mutation } from "@local/common";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

@Injectable()
@PothosMutation()
export class CurrentMutation {
  readonly CurrentCreate;
  readonly CurrentUpdate;

  constructor(builder: SchemaBuilderService, prismaService: PrismaService, subscriptionService: SubscriptionService) {
    this.CurrentCreate = builder.prismaCreate("User", {
      name: "CurrentCreateInput",
      fields: {
        name: "String",
        email: "String",
        image: "String",
        preferences: builder.UserPreferences,
        password: "String",
      },
    });

    this.CurrentUpdate = builder.prismaUpdate("User", {
      name: "CurrentUpdateInput",
      fields: {
        name: "String",
        email: "String",
        image: "String",
        preferences: builder.UserPreferences,
        password: "String",
      },
    });

    const { CurrentCreate, CurrentUpdate } = this;

    builder.mutationField("createCurrent", (t) =>
      t.prismaField({
        description: "Create a new user.",
        authScopes: {},
        type: "User",
        args: {
          create: t.arg({ type: CurrentCreate, required: true }),
        },
        resolve: async (query, _root, args, ctx, _info) => {
          if (ctx.user?.id) {
            throw new Error("User is currently logged in.");
          }
          return prismaService.prisma.user
            .create({
              ...query,
              data: args.create,
            })
            .then(async (user) => {
              await subscriptionService.publish("User", {
                topic: "User",
                id: user.id,
                mutation: Mutation.Created,
              });
              return user;
            });
        },
      }),
    );

    builder.mutationField("updateCurrent", (t) =>
      t.prismaField({
        description: "Update the currently logged in user.",
        authScopes: { user: true },
        type: "User",
        args: {
          update: t.arg({ type: CurrentUpdate, required: true }),
        },
        resolve: async (query, _root, args, ctx, _info) => {
          if (!ctx.user?.id) {
            throw new Error("User must be logged in.");
          }
          return prismaService.prisma.user
            .update({
              ...query,
              where: { id: ctx.user.id },
              data: args.update,
            })
            .then(async (user) => {
              await subscriptionService.publish("User", {
                topic: "User",
                id: user.id,
                mutation: Mutation.Updated,
              });
              await subscriptionService.publish(`User/${user.id}`, {
                topic: "User",
                id: user.id,
                mutation: Mutation.Updated,
              });
              return user;
            });
        },
      }),
    );

    builder.mutationField("deleteCurrent", (t) =>
      t.prismaField({
        description: "Delete the currently logged in user.",
        authScopes: { user: true },
        type: "User",
        resolve: async (query, _root, _args, ctx, _info) => {
          if (!ctx.user?.id) {
            throw new Error("User must be logged in.");
          }
          return prismaService.prisma.user
            .delete({
              ...query,
              where: { id: ctx.user.id },
            })
            .then(async (user) => {
              await subscriptionService.publish("User", {
                topic: "User",
                id: user.id,
                mutation: Mutation.Deleted,
              });
              await subscriptionService.publish(`User/${user.id}`, {
                topic: "User",
                id: user.id,
                mutation: Mutation.Deleted,
              });
              return user;
            });
        },
      }),
    );
  }
}
