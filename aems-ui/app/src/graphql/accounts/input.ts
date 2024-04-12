import { Prisma } from "@prisma/client";

import { builder, DateTimeFilter, StringFilter } from "../builder";
import { UserOrderBy, UserWhere } from "../users/input";

export const AccountFields = builder.enumType("AccountFields", {
  values: Object.values(Prisma.AccountScalarFieldEnum),
});

export const AccountAggregate = builder.inputType("AccountAggregate", {
  fields: (t) => ({
    average: t.field({ type: [AccountFields] }),
    count: t.field({ type: [AccountFields] }),
    maximum: t.field({ type: [AccountFields] }),
    minimum: t.field({ type: [AccountFields] }),
    sum: t.field({ type: [AccountFields] }),
  }),
});

export const AccountWhereUnique = builder.prismaWhereUnique("Account", {
  fields: {
    id: "String",
  },
});

export const AccountWhere = builder.prismaWhere("Account", {
  fields: {
    id: StringFilter,
    type: StringFilter,
    provider: StringFilter,
    createdAt: DateTimeFilter,
    updatedAt: DateTimeFilter,
    userId: StringFilter,
    user: UserWhere,
  },
});

export const AccountOrderBy = builder.prismaOrderBy("Account", {
  fields: {
    id: true,
    type: true,
    provider: true,
    createdAt: true,
    updatedAt: true,
    userId: true,
    user: UserOrderBy,
  },
});

export const AccountCreate = builder.prismaCreate("Account", {
  fields: {
    type: "String",
    provider: "String",
    providerAccountId: "String",
    expiresAt: "Int",
    scope: "String",
    idToken: "String",
    userId: "String",
  },
});

export const AccountUpdate = builder.prismaUpdate("Account", {
  fields: {
    type: "String",
    provider: "String",
    providerAccountId: "String",
    expiresAt: "Int",
    scope: "String",
    idToken: "String",
    userId: "String",
  },
});
