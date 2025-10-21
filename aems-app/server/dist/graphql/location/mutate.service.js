"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationMutation = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@local/common");
const builder_service_1 = require("../builder.service");
const query_service_1 = require("./query.service");
const object_service_1 = require("./object.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
const query_service_2 = require("../unit/query.service");
let LocationMutation = class LocationMutation {
    constructor(builder, prismaService, subscriptionService, locationQuery, _locationObject, unitQuery) {
        const { LocationWhereUnique } = locationQuery;
        const { UnitWhereUnique } = unitQuery;
        const LocationCreateUnits = builder.prismaCreateRelation("Location", "units", {
            fields: {
                connect: UnitWhereUnique,
            },
        });
        this.LocationCreate = builder.prismaCreate("Location", {
            fields: {
                name: "String",
                latitude: "Float",
                longitude: "Float",
                units: LocationCreateUnits,
            },
        });
        const LocationUpdateUnits = builder.prismaUpdateRelation("Location", "units", {
            fields: {
                connect: UnitWhereUnique,
            },
        });
        this.LocationUpdate = builder.prismaUpdate("Location", {
            fields: {
                name: "String",
                latitude: "Float",
                longitude: "Float",
                units: LocationUpdateUnits,
            },
        });
        const { LocationCreate, LocationUpdate } = this;
        builder.mutationField("createLocation", (t) => t.prismaField({
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
                        mutation: common_2.Mutation.Created,
                    });
                    return location;
                });
            },
        }));
        builder.mutationField("updateLocation", (t) => t.prismaField({
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
                        mutation: common_2.Mutation.Updated,
                    });
                    await subscriptionService.publish(`Location/${location.id}`, {
                        topic: "Location",
                        id: location.id.toString(),
                        mutation: common_2.Mutation.Updated,
                    });
                    return location;
                });
            },
        }));
        builder.mutationField("deleteLocation", (t) => t.prismaField({
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
                        mutation: common_2.Mutation.Deleted,
                    });
                    await subscriptionService.publish(`Location/${location.id}`, {
                        topic: "Location",
                        id: location.id.toString(),
                        mutation: common_2.Mutation.Deleted,
                    });
                    return location;
                });
            },
        }));
    }
};
exports.LocationMutation = LocationMutation;
exports.LocationMutation = LocationMutation = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        query_service_1.LocationQuery,
        object_service_1.LocationObject,
        query_service_2.UnitQuery])
], LocationMutation);
//# sourceMappingURL=mutate.service.js.map