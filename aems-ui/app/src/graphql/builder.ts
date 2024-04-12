import { DateTimeResolver, JSONResolver } from "graphql-scalars";

import { AuthRoles } from "@/auth/types";
import { LogType, StageType } from "@/common";
import PrismaTypes from "@/generated/pothos";
import prisma from "@/prisma";
import SchemaBuilder from "@pothos/core";
import ComplexityPlugin from "@pothos/plugin-complexity";
import PrismaPlugin from "@pothos/plugin-prisma";
import PrismaUtils from "@pothos/plugin-prisma-utils";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import { Holiday_type } from "@prisma/client";

import { Context, Scalars } from "./types";

export const builder = new SchemaBuilder<{
  Context: Context;
  AuthScopes: AuthRoles;
  PrismaTypes: PrismaTypes;
  Scalars: Scalars;
}>({
  plugins: [ScopeAuthPlugin, PrismaPlugin, PrismaUtils, ComplexityPlugin],
  authScopes: async (context) => context.authUser.roles,
  scopeAuthOptions: {
    // Recommended when using subscriptions
    // when this is not set, auth checks are run when event is resolved rather than when the subscription is created
    authorizeOnSubscribe: true,
    treatErrorsAsUnauthorized: true,
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
  complexity: {
    defaultComplexity: 1,
    defaultListMultiplier: 10,
    limit: {
      complexity: 300,
      depth: 5,
    },
  },
});

builder.addScalarType("JSON", JSONResolver, {});
builder.addScalarType("DateTime", DateTimeResolver, {});

builder.enumType("LogType", { values: LogType.values.map((v) => v.enum) });
builder.enumType("StageType", { values: StageType.values.map((v) => v.enum) });
builder.enumType("HolidayType", { values: [Holiday_type.Custom, Holiday_type.Disabled, Holiday_type.Enabled] });

builder.queryType({});
builder.mutationType({});
// builder.subscriptionType({});

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
  ops: ["contains", "equals", "gt", "gte", "lt", "lte", "not", "in"],
});

export const LogTypeFilter = builder.prismaFilter("LogType", {
  ops: ["equals", "not", "in"],
});

export const StageTypeFilter = builder.prismaFilter("StageType", {
  ops: ["equals", "not", "in"],
});

export const HolidayTypeFilter = builder.prismaFilter("HolidayType", {
  ops: ["equals", "not", "in"],
});

export const PagingInput = builder.inputType("PagingInput", {
  fields: (t) => ({
    skip: t.int({ required: true }),
    take: t.int({ required: true }),
  }),
});
