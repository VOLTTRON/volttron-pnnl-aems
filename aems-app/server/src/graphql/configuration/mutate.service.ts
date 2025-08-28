import { Injectable } from "@nestjs/common";
import { Mutation } from "@local/common";
import { SchemaBuilderService } from "../builder.service";
import { ConfigurationQuery } from "./query.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

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
  ) {
    const { ConfigurationWhereUnique } = configurationQuery;

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
      },
    });

    this.ConfigurationUpdate = builder.prismaUpdate("Configuration", {
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
