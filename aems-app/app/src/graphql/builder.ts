import { DateTimeResolver, JSONObjectResolver } from "graphql-scalars";
import { AuthRoles } from "@/auth/types";
import { LogType } from "@/common";
import { FeedbackStatusType } from "@/common";

import PrismaTypes from "@/generated/prisma-pothos";
import { prisma } from "@/prisma";
import SchemaBuilder from "@pothos/core";
import ComplexityPlugin from "@pothos/plugin-complexity";
import PrismaPlugin from "@pothos/plugin-prisma";
import PrismaUtils from "@pothos/plugin-prisma-utils";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import SmartSubscriptionsPlugin, { subscribeOptionsFromIterator } from "@pothos/plugin-smart-subscriptions";
import RelayPlugin from "@pothos/plugin-relay";
import { Context, Scalars } from "./types";
import { MutationType } from "@/generated/graphql-codegen/graphql";

export const builder = new SchemaBuilder<{
  Context: Context;
  AuthScopes: AuthRoles;
  PrismaTypes: PrismaTypes;
  Scalars: Scalars;
}>({
  plugins: [RelayPlugin, ScopeAuthPlugin, PrismaPlugin, PrismaUtils, SmartSubscriptionsPlugin, ComplexityPlugin],
  relay: {},
  scopeAuth: {
    // Recommended when using subscriptions
    // when this is not set, auth checks are run when event is resolved rather than when the subscription is created
    authorizeOnSubscribe: true,
    treatErrorsAsUnauthorized: true,
    authScopes: async (context) => context.authUser.roles,
  },
  prisma: {
    client: prisma,
    // defaults to false, uses /// comments from prisma schema as descriptions
    // for object types, relations and exposed fields.
    // descriptions can be omitted by setting description to false
    // exposeDescriptions: boolean | { models: boolean, fields: boolean },
    exposeDescriptions: true,
    // use where clause from prismaRelatedConnection for totalCount (will true by default in next major version)
    filterConnectionTotalCount: true,
    // warn when not using a query parameter correctly
    onUnusedQuery: process.env.NODE_ENV === "production" ? null : "warn",
  },
  smartSubscriptions: {
    ...subscribeOptionsFromIterator((name, { pubsub }) => {
      return pubsub.asyncIterator(name);
    }),
  },
  complexity: {
    defaultComplexity: 1,
    defaultListMultiplier: 10,
    limit: {
      complexity: 500,
      depth: 5,
    },
  },
});

builder.addScalarType("DateTime", DateTimeResolver, {});
builder.addScalarType("JSON", JSONObjectResolver, {});

builder.scalarType("Preferences", { serialize: (v) => v });
builder.scalarType("Event", { serialize: (v) => v });

builder.enumType("LogType", { values: LogType.values.map((v) => v.enum) });
builder.enumType("FeedbackStatusType", { values: FeedbackStatusType.values.map((v) => v.enum) });
builder.enumType("MutationType", { values: Object.values(MutationType) });

builder.queryType({});
builder.mutationType({});
builder.subscriptionType({});

export const BooleanFilter = builder.prismaFilter("Boolean", {
  ops: ["equals", "not"],
});

export const IntFilter = builder.prismaFilter("Int", {
  ops: ["equals", "gt", "gte", "lt", "lte", "not", "in"],
});

export const FloatFilter = builder.prismaFilter("Float", {
  ops: ["equals", "gt", "gte", "lt", "lte", "not", "in"],
});

export const StringFilter = builder.prismaFilter("String", {
  ops: ["contains", "equals", "startsWith", "endsWith", "not", "in", "mode"],
});

export const DateTimeFilter = builder.prismaFilter("DateTime", {
  ops: ["contains", "equals", "gt", "gte", "lt", "lte", "not", "in", "mode"],
});

export const LogTypeFilter = builder.prismaFilter("LogType", {
  ops: ["equals", "not", "in", "mode"],
});

export const MutationTypeFilter = builder.prismaFilter("MutationType", {
  ops: ["equals", "not", "in", "mode"],
});

export const PagingInput = builder.inputType("PagingInput", {
  fields: (t) => ({
    skip: t.int({ required: true }),
    take: t.int({ required: true }),
  }),
});
