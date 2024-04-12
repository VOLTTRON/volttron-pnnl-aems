import { Prisma } from "@prisma/client";

import { builder, DateTimeFilter, IntFilter, LogTypeFilter, StringFilter } from "../builder";

export const LogFields = builder.enumType("LogFields", {
  values: Object.values(Prisma.LogScalarFieldEnum),
});

export const LogAggregate = builder.inputType("LogAggregate", {
  fields: (t) => ({
    average: t.field({ type: [LogFields] }),
    count: t.field({ type: [LogFields] }),
    maximum: t.field({ type: [LogFields] }),
    minimum: t.field({ type: [LogFields] }),
    sum: t.field({ type: [LogFields] }),
  }),
});

export const LogWhereUnique = builder.prismaWhereUnique("Log", {
  fields: {
    id: "Int",
  },
});
export const LogWhere = builder.prismaWhere("Log", {
  fields: {
    id: IntFilter,
    type: LogTypeFilter,
    message: StringFilter,
    expiration: DateTimeFilter,
    createdAt: DateTimeFilter,
    updatedAt: DateTimeFilter,
  },
});

export const LogOrderBy = builder.prismaOrderBy("Log", {
  fields: {
    id: true,
    type: true,
    message: true,
    expiration: true,
    createdAt: true,
    updatedAt: true,
  },
});

export const LogCreate = builder.prismaCreate("Log", {
  fields: {
    type: "LogType",
    message: "String",
    expiration: "DateTime",
  },
});

export const LogUpdate = builder.prismaUpdate("Log", {
  fields: {
    type: "LogType",
    message: "String",
    expiration: "DateTime",
  },
});
