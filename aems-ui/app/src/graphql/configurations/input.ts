import { Prisma } from "@prisma/client";

import { builder, DateTimeFilter, IntFilter, StageTypeFilter, StringFilter } from "../builder";

export const ConfigurationsFields = builder.enumType("ConfigurationsFields", {
  values: Object.values(Prisma.ConfigurationsScalarFieldEnum),
});

export const ConfigurationsAggregate = builder.inputType("ConfigurationsAggregate", {
  fields: (t) => ({
    average: t.field({ type: [ConfigurationsFields] }),
    count: t.field({ type: [ConfigurationsFields] }),
    maximum: t.field({ type: [ConfigurationsFields] }),
    minimum: t.field({ type: [ConfigurationsFields] }),
    sum: t.field({ type: [ConfigurationsFields] }),
  }),
});

export const ConfigurationsWhereUnique = builder.prismaWhereUnique("Configurations", {
  fields: {
    id: "Int",
  },
});

export const ConfigurationsWhere = builder.prismaWhere("Configurations", {
  fields: {
    id: IntFilter,
    stage: StageTypeFilter,
    message: StringFilter,
    correlation: StringFilter,
    createdAt: DateTimeFilter,
    updatedAt: DateTimeFilter,
    // setpointId: IntFilter,
    // mondayScheduleId: IntFilter,
    // tuesdayScheduleId: IntFilter,
    // wednesdayScheduleId: IntFilter,
    // thursdayScheduleId: IntFilter,
    // fridayScheduleId: IntFilter,
    // saturdayScheduleId: IntFilter,
    // sundayScheduleId: IntFilter,
    // holidayScheduleId: IntFilter,
  },
});

export const ConfigurationsOrderBy = builder.prismaOrderBy("Configurations", {
  fields: {
    id: true,
    createdAt: true,
    updatedAt: true
  },
});

export const ConfigurationsUpdate = builder.prismaUpdate("Configurations", {
  fields: {
    stage: "StageType",
  },
});
