import { SchemaBuilderService } from "../builder.service";
import { AggregationType, CalculationType, HistorianDataPoint, HistorianTimeSeries, HistorianAggregate, HistorianMetricCurrent, HistorianMultiSystemData, HistorianReplicationInfo, PublisherInfo, SubscriberSetupSql, MonitoringSql, ReplicationSlot } from "@local/common";
import { UnitMetric, WeatherMetric } from "@/historian/metrics";
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
    readonly HistorianMultiSystemData: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, HistorianMultiSystemData, HistorianMultiSystemData, HistorianMultiSystemData>;
    readonly HistorianReplicationInfo: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, HistorianReplicationInfo, HistorianReplicationInfo, HistorianReplicationInfo>;
    readonly PublisherInfo: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, PublisherInfo, PublisherInfo, PublisherInfo>;
    readonly SubscriberSetupSql: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, SubscriberSetupSql, SubscriberSetupSql, SubscriberSetupSql>;
    readonly MonitoringSql: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, MonitoringSql, MonitoringSql, MonitoringSql>;
    readonly ReplicationSlot: PothosSchemaTypes.ScalarRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, ReplicationSlot, ReplicationSlot, ReplicationSlot>;
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
    readonly UnitMetric: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/core").ValuesFromEnum<typeof UnitMetric>, import("@pothos/core").ValuesFromEnum<typeof UnitMetric>>;
    readonly WeatherMetric: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/core").ValuesFromEnum<typeof WeatherMetric>, import("@pothos/core").ValuesFromEnum<typeof WeatherMetric>>;
    constructor(builder: SchemaBuilderService);
}
