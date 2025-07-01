import { Injectable } from "@nestjs/common";
import { Mutation } from "@local/common";
import { SchemaBuilderService } from "../builder.service";
import { ControlQuery } from "./query.service";
import { ControlObject } from "./object.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

@Injectable()
@PothosMutation()
export class ControlMutation {
  readonly ControlCreate;
  readonly ControlUpdate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    controlQuery: ControlQuery,
    controlObject: ControlObject,
  ) {
    const { ControlWhereUnique } = controlQuery;
    const { ModelStage } = controlObject;

    this.ControlCreate = builder.prismaCreate("Control", {
      fields: {
        stage: ModelStage,
        message: "String",
        correlation: "String",
        name: "String",
        campus: "String",
        building: "String",
        label: "String",
        peakLoadExclude: "Boolean",
      },
    });

    this.ControlUpdate = builder.prismaUpdate("Control", {
      fields: {
        stage: ModelStage,
        message: "String",
        correlation: "String",
        name: "String",
        campus: "String",
        building: "String",
        label: "String",
        peakLoadExclude: "Boolean",
      },
    });

    const { ControlCreate, ControlUpdate } = this;

    builder.mutationField("createControl", (t) =>
      t.prismaField({
        description: "Create a new control.",
        authScopes: { admin: true },
        type: "Control",
        args: {
          create: t.arg({ type: ControlCreate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.control
            .create({
              ...query,
              data: { ...args.create },
            })
            .then(async (control) => {
              await subscriptionService.publish("Control", { topic: "Control", id: control.id, mutation: Mutation.Created });
              return control;
            });
        },
      }),
    );

    builder.mutationField("updateControl", (t) =>
      t.prismaField({
        description: "Update the specified control.",
        authScopes: { admin: true },
        type: "Control",
        args: {
          where: t.arg({ type: ControlWhereUnique, required: true }),
          update: t.arg({ type: ControlUpdate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.control
            .update({
              ...query,
              where: args.where,
              data: args.update,
            })
            .then(async (control) => {
              await subscriptionService.publish("Control", { topic: "Control", id: control.id, mutation: Mutation.Updated });
              await subscriptionService.publish(`Control/${control.id}`, {
                topic: "Control",
                id: control.id,
                mutation: Mutation.Updated,
              });
              return control;
            });
        },
      }),
    );

    builder.mutationField("deleteControl", (t) =>
      t.prismaField({
        description: "Delete the specified control.",
        authScopes: { admin: true },
        type: "Control",
        args: {
          where: t.arg({ type: ControlWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.control
            .delete({
              ...query,
              where: args.where,
            })
            .then(async (control) => {
              await subscriptionService.publish("Control", { topic: "Control", id: control.id, mutation: Mutation.Deleted });
              await subscriptionService.publish(`Control/${control.id}`, {
                topic: "Control",
                id: control.id,
                mutation: Mutation.Deleted,
              });
              return control;
            });
        },
      }),
    );
  }
}
