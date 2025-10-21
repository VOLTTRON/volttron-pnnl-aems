import { Injectable } from "@nestjs/common";
import { Mutation } from "@local/common";
import { SchemaBuilderService } from "../builder.service";
import { UnitQuery } from "./query.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { ConfigurationMutation } from "../configuration/mutate.service";
import { ControlMutation } from "../control/mutate.service";
import { LocationMutation } from "../location/mutate.service";

@Injectable()
@PothosMutation()
export class UnitMutation {
  readonly UnitCreate;
  readonly UnitUpdate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    unitQuery: UnitQuery,
    configurationMutation: ConfigurationMutation,
    controlMutation: ControlMutation,
    locationMutation: LocationMutation,
  ) {
    const { UnitWhereUnique } = unitQuery;
    const { ConfigurationUpdate } = configurationMutation;
    const { ControlUpdate } = controlMutation;
    const { LocationUpdate } = locationMutation;

    this.UnitCreate = builder.prismaCreate("Unit", {
      fields: {
        stage: builder.ModelStage,
        message: "String",
        correlation: "String",
        name: "String",
        campus: "String",
        building: "String",
        system: "String",
        timezone: "String",
        label: "String",
        coolingCapacity: "Float",
        compressors: "Int",
        coolingLockout: "Float",
        optimalStartLockout: "Float",
        optimalStartDeviation: "Float",
        earliestStart: "Int",
        latestStart: "Int",
        zoneLocation: "String",
        zoneMass: "String",
        zoneOrientation: "String",
        zoneBuilding: "String",
        heatPump: "Boolean",
        heatPumpBackup: "Float",
        economizer: "Boolean",
        heatPumpLockout: "Float",
        coolingPeakOffset: "Float",
        heatingPeakOffset: "Float",
        peakLoadExclude: "Boolean",
        economizerSetpoint: "Float",
        configurationId: "String",
        controlId: "String",
        locationId: "String",
      },
    });

    const UnitUpdateConfiguration = builder.prismaUpdateRelation("Unit", "configuration", {
      fields: {
        update: ConfigurationUpdate,
      },
    });

    const UnitUpdateControl = builder.prismaUpdateRelation("Unit", "control", {
      fields: {
        update: ControlUpdate,
      },
    });

    const UnitUpdateLocation = builder.prismaUpdateRelation("Unit", "location", {
      fields: {
        update: LocationUpdate,
      },
    });

    this.UnitUpdate = builder.prismaUpdate("Unit", {
      fields: {
        stage: builder.ModelStage,
        message: "String",
        correlation: "String",
        name: "String",
        campus: "String",
        building: "String",
        system: "String",
        timezone: "String",
        label: "String",
        coolingCapacity: "Float",
        compressors: "Int",
        coolingLockout: "Float",
        optimalStartLockout: "Float",
        optimalStartDeviation: "Float",
        earliestStart: "Int",
        latestStart: "Int",
        zoneLocation: "String",
        zoneMass: "String",
        zoneOrientation: "String",
        zoneBuilding: "String",
        heatPump: "Boolean",
        heatPumpBackup: "Float",
        economizer: "Boolean",
        heatPumpLockout: "Float",
        coolingPeakOffset: "Float",
        heatingPeakOffset: "Float",
        peakLoadExclude: "Boolean",
        economizerSetpoint: "Float",
        configurationId: "String",
        configuration: UnitUpdateConfiguration,
        controlId: "String",
        control: UnitUpdateControl,
        locationId: "String",
        location: UnitUpdateLocation,
      },
    });

    const { UnitCreate, UnitUpdate } = this;

    builder.mutationField("createUnit", (t) =>
      t.prismaField({
        description: "Create a new unit.",
        authScopes: { admin: true },
        type: "Unit",
        args: {
          create: t.arg({ type: UnitCreate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.unit
            .create({
              ...query,
              data: { ...args.create },
            })
            .then(async (unit) => {
              await subscriptionService.publish("Unit", { topic: "Unit", id: unit.id, mutation: Mutation.Created });
              return unit;
            });
        },
      }),
    );

    builder.mutationField("updateUnit", (t) =>
      t.prismaField({
        description: "Update the specified unit.",
        authScopes: { user: true },
        type: "Unit",
        args: {
          where: t.arg({ type: UnitWhereUnique, required: true }),
          update: t.arg({ type: UnitUpdate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.unit
            .update({
              ...query,
              where: args.where,
              data: args.update,
            })
            .then(async (unit) => {
              await subscriptionService.publish("Unit", { topic: "Unit", id: unit.id, mutation: Mutation.Updated });
              await subscriptionService.publish(`Unit/${unit.id}`, {
                topic: "Unit",
                id: unit.id,
                mutation: Mutation.Updated,
              });
              return unit;
            });
        },
      }),
    );

    builder.mutationField("deleteUnit", (t) =>
      t.prismaField({
        description: "Delete the specified unit.",
        authScopes: { admin: true },
        type: "Unit",
        args: {
          where: t.arg({ type: UnitWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.unit
            .delete({
              ...query,
              where: args.where,
            })
            .then(async (unit) => {
              await subscriptionService.publish("Unit", { topic: "Unit", id: unit.id, mutation: Mutation.Deleted });
              await subscriptionService.publish(`Unit/${unit.id}`, {
                topic: "Unit",
                id: unit.id,
                mutation: Mutation.Deleted,
              });
              return unit;
            });
        },
      }),
    );
  }
}
