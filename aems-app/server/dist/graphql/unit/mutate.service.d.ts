import { SchemaBuilderService } from "../builder.service";
import { UnitQuery } from "./query.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { ConfigurationMutation } from "../configuration/mutate.service";
import { ControlMutation } from "../control/mutate.service";
import { LocationMutation } from "../location/mutate.service";
import { ChangeService } from "@/change/change.service";
export declare class UnitMutation {
    readonly UnitCreate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.UnitCreateInput, {
        stage: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail", "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail">;
        message: "String";
        correlation: "String";
        name: "String";
        campus: "String";
        building: "String";
        system: "String";
        timezone: "String";
        label: "String";
        coolingCapacity: "Float";
        compressors: "Int";
        coolingLockout: "Float";
        optimalStartLockout: "Float";
        optimalStartDeviation: "Float";
        earliestStart: "Int";
        latestStart: "Int";
        zoneLocation: "String";
        zoneMass: "String";
        zoneOrientation: "String";
        zoneBuilding: "String";
        heatPump: "Boolean";
        heatPumpBackup: "Float";
        economizer: "Boolean";
        heatPumpLockout: "Float";
        coolingPeakOffset: "Float";
        heatingPeakOffset: "Float";
        peakLoadExclude: "Boolean";
        economizerSetpoint: "Float";
        configurationId: "String";
        controlId: "String";
        locationId: "String";
    }>>;
    readonly UnitUpdate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.UnitUpdateInput, {
        stage: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail", "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail">;
        message: "String";
        correlation: "String";
        name: "String";
        campus: "String";
        building: "String";
        system: "String";
        timezone: "String";
        label: "String";
        coolingCapacity: "Float";
        compressors: "Int";
        coolingLockout: "Float";
        optimalStartLockout: "Float";
        optimalStartDeviation: "Float";
        earliestStart: "Int";
        latestStart: "Int";
        zoneLocation: "String";
        zoneMass: "String";
        zoneOrientation: "String";
        zoneBuilding: "String";
        heatPump: "Boolean";
        heatPumpBackup: "Float";
        economizer: "Boolean";
        heatPumpLockout: "Float";
        coolingPeakOffset: "Float";
        heatingPeakOffset: "Float";
        peakLoadExclude: "Boolean";
        economizerSetpoint: "Float";
        configurationId: "String";
        configuration: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.ConfigurationUpdateOneWithoutUnitsNestedInput>;
        controlId: "String";
        control: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.ControlUpdateOneWithoutUnitsNestedInput>;
        locationId: "String";
        location: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.LocationUpdateOneWithoutUnitsNestedInput>;
    }>>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, subscriptionService: SubscriptionService, unitQuery: UnitQuery, configurationMutation: ConfigurationMutation, controlMutation: ControlMutation, locationMutation: LocationMutation, changeService: ChangeService);
}
