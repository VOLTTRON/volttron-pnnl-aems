import { Injectable } from "@nestjs/common";
import { Mutation } from "@local/common";
import { SchemaBuilderService } from "../builder.service";
import { ControlQuery } from "./query.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { UnitQuery } from "../unit/query.service";
import { ChangeService } from "@/change/change.service";
import { ChangeMutation } from "@prisma/client";
import { omit } from "lodash";

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
    unitQuery: UnitQuery,
    changeService: ChangeService,
  ) {
    const { ControlWhereUnique } = controlQuery;
    const { UnitWhereUnique } = unitQuery;

    this.ControlCreate = builder.prismaCreate("Control", {
      fields: {
        stage: builder.ModelStage,
        message: "String",
        correlation: "String",
        name: "String",
        campus: "String",
        building: "String",
        label: "String",
        peakLoadExclude: "Boolean",
        units: UnitWhereUnique,
      },
    });

    this.ControlUpdate = builder.prismaUpdate("Control", {
      fields: {
        stage: builder.ModelStage,
        message: "String",
        correlation: "String",
        name: "String",
        campus: "String",
        building: "String",
        label: "String",
        peakLoadExclude: "Boolean",
        units: UnitWhereUnique,
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
        resolve: async (query, _root, args, ctx, _info) => {
          return prismaService.prisma.control
            .create({
              ...query,
              data: { ...args.create },
            })
            .then(async (control) => {
              await subscriptionService.publish("Control", {
                topic: "Control",
                id: control.id,
                mutation: Mutation.Created,
              });
              await changeService.handleChange(
                "Unknown",
                omit(control, ["stage", "message"]),
                "Control",
                ChangeMutation.Create,
                ctx.user!,
              );
              return control;
            });
        },
      }),
    );

    builder.mutationField("updateControl", (t) =>
      t.prismaField({
        description: "Update the specified control.",
        authScopes: { user: true },
        type: "Control",
        args: {
          where: t.arg({ type: ControlWhereUnique, required: true }),
          update: t.arg({ type: ControlUpdate, required: true }),
        },
        resolve: async (query, _root, args, ctx, _info) => {
          return prismaService.prisma.control
            .update({
              ...query,
              where: args.where,
              data: args.update,
            })
            .then(async (control) => {
              await subscriptionService.publish("Control", {
                topic: "Control",
                id: control.id,
                mutation: Mutation.Updated,
              });
              await subscriptionService.publish(`Control/${control.id}`, {
                topic: "Control",
                id: control.id,
                mutation: Mutation.Updated,
              });
              await changeService.handleChange(
                "Unknown",
                omit(control, ["stage", "message"]),
                "Control",
                ChangeMutation.Update,
                ctx.user!,
              );
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
        resolve: async (query, _root, args, ctx, _info) => {
          return prismaService.prisma.control
            .delete({
              ...query,
              where: args.where,
            })
            .then(async (control) => {
              await subscriptionService.publish("Control", {
                topic: "Control",
                id: control.id,
                mutation: Mutation.Deleted,
              });
              await subscriptionService.publish(`Control/${control.id}`, {
                topic: "Control",
                id: control.id,
                mutation: Mutation.Deleted,
              });
              await changeService.handleChange(
                "Unknown",
                omit(control, ["stage", "message"]),
                "Control",
                ChangeMutation.Delete,
                ctx.user!,
              );
              return control;
            });
        },
      }),
    );
  }
}
