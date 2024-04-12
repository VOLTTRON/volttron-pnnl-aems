import { Prisma } from "@prisma/client";

import { builder, DateTimeFilter, IntFilter, StageTypeFilter, StringFilter } from "../builder";

export const UnitsFields = builder.enumType("UnitsFields", {
  values: Object.values(Prisma.UnitsScalarFieldEnum),
});

export const UnitsAggregate = builder.inputType("UnitsAggregate", {
  fields: (t) => ({
    average: t.field({ type: [UnitsFields] }),
    count: t.field({ type: [UnitsFields] }),
    maximum: t.field({ type: [UnitsFields] }),
    minimum: t.field({ type: [UnitsFields] }),
    sum: t.field({ type: [UnitsFields] }),
  }),
});

export const UnitsWhereUnique = builder.prismaWhereUnique("Units", {
  fields: {
    id: "Int",
  },
});

export const UnitsWhere = builder.prismaWhere("Units", {
  fields: {
    id: IntFilter,
    stage: StageTypeFilter,
    message: StringFilter,
    correlation: StringFilter,
    createdAt: DateTimeFilter,
    updatedAt: DateTimeFilter,
    configurationId: IntFilter,
    // controlId: IntFilter,
  },
});

export const UnitsOrderBy = builder.prismaOrderBy("Units", {
  fields: {
    id: true,
    createdAt: true,
    updatedAt: true
  },
});

export const UnitsUpdate = builder.prismaUpdate("Units", {
  fields: {
    stage: "StageType",
  },
});
