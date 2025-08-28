import { Injectable } from "@nestjs/common";
import { Mutation } from "@local/common";
import { SchemaBuilderService } from "../builder.service";
import { LocationQuery } from "./query.service";
import { LocationObject } from "./object.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

@Injectable()
@PothosMutation()
export class LocationMutation {
  readonly LocationCreate;
  readonly LocationUpdate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    locationQuery: LocationQuery,
    _locationObject: LocationObject,
  ) {
    const { LocationWhereUnique } = locationQuery;

    this.LocationCreate = builder.prismaCreate("Location", {
      fields: {
        name: "String",
        latitude: "Float",
        longitude: "Float",
      },
    });

    this.LocationUpdate = builder.prismaUpdate("Location", {
      fields: {
        name: "String",
        latitude: "Float",
        longitude: "Float",
      },
    });

    const { LocationCreate, LocationUpdate } = this;

    builder.mutationField("createLocation", (t) =>
      t.prismaField({
        description: "Create a new location.",
        authScopes: { user: true },
        type: "Location",
        args: {
          create: t.arg({ type: LocationCreate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.location
            .create({
              ...query,
              data: { ...args.create },
            })
            .then(async (location) => {
              await subscriptionService.publish("Location", {
                topic: "Location",
                id: location.id.toString(),
                mutation: Mutation.Created,
              });
              return location;
            });
        },
      }),
    );

    builder.mutationField("updateLocation", (t) =>
      t.prismaField({
        description: "Update the specified location.",
        authScopes: { user: true },
        type: "Location",
        args: {
          where: t.arg({ type: LocationWhereUnique, required: true }),
          update: t.arg({ type: LocationUpdate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.location
            .update({
              ...query,
              where: args.where,
              data: args.update,
            })
            .then(async (location) => {
              await subscriptionService.publish("Location", {
                topic: "Location",
                id: location.id.toString(),
                mutation: Mutation.Updated,
              });
              await subscriptionService.publish(`Location/${location.id}`, {
                topic: "Location",
                id: location.id.toString(),
                mutation: Mutation.Updated,
              });
              return location;
            });
        },
      }),
    );

    builder.mutationField("deleteLocation", (t) =>
      t.prismaField({
        description: "Delete the specified location.",
        authScopes: { user: true },
        type: "Location",
        args: {
          where: t.arg({ type: LocationWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.location
            .delete({
              ...query,
              where: args.where,
            })
            .then(async (location) => {
              await subscriptionService.publish("Location", {
                topic: "Location",
                id: location.id.toString(),
                mutation: Mutation.Deleted,
              });
              await subscriptionService.publish(`Location/${location.id}`, {
                topic: "Location",
                id: location.id.toString(),
                mutation: Mutation.Deleted,
              });
              return location;
            });
        },
      }),
    );
  }
}
