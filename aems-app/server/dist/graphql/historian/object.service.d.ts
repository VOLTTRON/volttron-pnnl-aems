import { SchemaBuilderService } from "../builder.service";
import { AggregationType, CalculationType, HistorianDataPoint, HistorianTimeSeries, HistorianAggregate, HistorianMetricCurrent, HistorianMultiUnitData } from "@/historian/historian.types";
export declare class HistorianObject {
    readonly HistorianDataPoint: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, HistorianDataPoint, HistorianDataPoint, HistorianDataPoint>;
    readonly HistorianTimeSeries: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, HistorianTimeSeries, HistorianTimeSeries, HistorianTimeSeries>;
    readonly HistorianAggregate: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, HistorianAggregate, HistorianAggregate, HistorianAggregate>;
    readonly HistorianMetricCurrent: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, HistorianMetricCurrent, HistorianMetricCurrent, HistorianMetricCurrent>;
    readonly HistorianMultiUnitData: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, HistorianMultiUnitData, HistorianMultiUnitData, HistorianMultiUnitData>;
    readonly AggregationType: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/core").ValuesFromEnum<typeof AggregationType>, import("@pothos/core").ValuesFromEnum<typeof AggregationType>>;
    readonly CalculationType: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/core").ValuesFromEnum<typeof CalculationType>, import("@pothos/core").ValuesFromEnum<typeof CalculationType>>;
    constructor(builder: SchemaBuilderService);
}
