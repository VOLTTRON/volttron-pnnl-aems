import { omit } from "lodash";

import { Prisma } from "@prisma/client";

import { builder, DateTimeFilter, StringFilter } from "../builder";

export const UserFields = builder.enumType("UserFields", {
  values: Object.values(omit(Prisma.UserScalarFieldEnum, "password")),
});

export const UserAggregate = builder.inputType("UserAggregate", {
  fields: (t) => ({
    average: t.field({ type: [UserFields] }),
    count: t.field({ type: [UserFields] }),
    maximum: t.field({ type: [UserFields] }),
    minimum: t.field({ type: [UserFields] }),
    sum: t.field({ type: [UserFields] }),
  }),
});

export const UserWhereUnique = builder.prismaWhereUnique("User", {
  fields: {
    id: "String",
  },
});

export const UserWhere = builder.prismaWhere("User", {
  fields: {
    id: StringFilter,
    name: StringFilter,
    email: StringFilter,
    role: StringFilter,
    altId: StringFilter,
    createdAt: DateTimeFilter,
    updatedAt: DateTimeFilter,
  },
});

export const UserOrderBy = builder.prismaOrderBy("User", {
  fields: {
    id: true,
    name: true,
    email: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  },
});

export const UserCreate = builder.prismaCreate("User", {
  fields: {
    name: "String",
    email: "String",
    password: "String",
    role: "String",
    preferences: "String",
  },
});

export const UserUpdate = builder.prismaUpdate("User", {
  fields: {
    name: "String",
    email: "String",
    password: "String",
    role: "String",
    preferences: "String",
  },
});
