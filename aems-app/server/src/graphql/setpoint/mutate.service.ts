import { Injectable } from "@nestjs/common";
import { Mutation } from "@local/common";
import { SchemaBuilderService } from "../builder.service";
import { SetpointQuery } from "./query.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

@Injectable()
@PothosMutation()
export class SetpointMutation {
  readonly SetpointCreate;
  readonly SetpointUpdate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    setpointQuery: SetpointQuery,
  ) {
    const { SetpointWhereUnique } = setpointQuery;

    this.SetpointCreate = builder.prismaCreate("Setpoint", {
      fields: {
        stage: builder.ModelStage,
        message: "String",
        correlation: "String",
        label: "String",
        setpoint: "Float",
        deadband: "Float",
        heating: "Float",
        cooling: "Float",
      },
    });

    this.SetpointUpdate = builder.prismaUpdate("Setpoint", {
      fields: {
        stage: builder.ModelStage,
        message: "String",
        correlation: "String",
        label: "String",
        setpoint: "Float",
        deadband: "Float",
        heating: "Float",
        cooling: "Float",
      },
    });

    const { SetpointCreate, SetpointUpdate } = this;

    builder.mutationField("createSetpoint", (t) =>
      t.prismaField({
        description: "Create a new setpoint.",
        authScopes: { admin: true },
        type: "Setpoint",
        args: {
          create: t.arg({ type: SetpointCreate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.setpoint
            .create({
              ...query,
              data: { ...args.create },
            })
            .then(async (setpoint) => {
              await subscriptionService.publish("Setpoint", {
                topic: "Setpoint",
                id: setpoint.id,
                mutation: Mutation.Created,
              });
              return setpoint;
            });
        },
      }),
    );

    builder.mutationField("updateSetpoint", (t) =>
      t.prismaField({
        description: "Update the specified setpoint.",
        authScopes: { admin: true },
        type: "Setpoint",
        args: {
          where: t.arg({ type: SetpointWhereUnique, required: true }),
          update: t.arg({ type: SetpointUpdate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.setpoint
            .update({
              ...query,
              where: args.where,
              data: args.update,
            })
            .then(async (setpoint) => {
              await subscriptionService.publish("Setpoint", {
                topic: "Setpoint",
                id: setpoint.id,
                mutation: Mutation.Updated,
              });
              await subscriptionService.publish(`Setpoint/${setpoint.id}`, {
                topic: "Setpoint",
                id: setpoint.id,
                mutation: Mutation.Updated,
              });
              return setpoint;
            });
        },
      }),
    );

    builder.mutationField("deleteSetpoint", (t) =>
      t.prismaField({
        description: "Delete the specified setpoint.",
        authScopes: { admin: true },
        type: "Setpoint",
        args: {
          where: t.arg({ type: SetpointWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.setpoint
            .delete({
              ...query,
              where: args.where,
            })
            .then(async (setpoint) => {
              await subscriptionService.publish("Setpoint", {
                topic: "Setpoint",
                id: setpoint.id,
                mutation: Mutation.Deleted,
              });
              await subscriptionService.publish(`Setpoint/${setpoint.id}`, {
                topic: "Setpoint",
                id: setpoint.id,
                mutation: Mutation.Deleted,
              });
              return setpoint;
            });
        },
      }),
    );
  }
}
