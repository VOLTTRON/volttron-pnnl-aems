import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
export declare class UnitObject {
    readonly UnitObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "Unit";
        Shape: import(".prisma/client").Unit;
        Include: Prisma.UnitInclude;
        Select: Prisma.UnitSelect;
        OrderBy: Prisma.UnitOrderByWithRelationInput;
        WhereUnique: Prisma.UnitWhereUniqueInput;
        Where: Prisma.UnitWhereInput;
        Create: Prisma.UnitCreateInput;
        Update: Prisma.UnitUpdateInput;
        RelationName: "configuration" | "control" | "location" | "users";
        ListRelations: "users";
        Relations: {
            configuration: {
                Shape: import(".prisma/client").Configuration | null;
                Name: "Configuration";
                Nullable: true;
            };
            control: {
                Shape: import(".prisma/client").Control | null;
                Name: "Control";
                Nullable: true;
            };
            location: {
                Shape: import(".prisma/client").Location | null;
                Name: "Location";
                Nullable: true;
            };
            users: {
                Shape: import(".prisma/client").User[];
                Name: "User";
                Nullable: false;
            };
        };
    }, {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        stage: import(".prisma/client").$Enums.ModelStage;
        correlation: string | null;
        campus: string;
        building: string;
        system: string;
        timezone: string;
        label: string;
        coolingCapacity: number;
        compressors: number;
        coolingLockout: number;
        optimalStartLockout: number;
        optimalStartDeviation: number;
        earliestStart: number;
        latestStart: number;
        zoneLocation: string;
        zoneMass: string;
        zoneOrientation: string;
        zoneBuilding: string;
        heatPump: boolean;
        heatPumpBackup: number;
        economizer: boolean;
        heatPumpLockout: number;
        coolingPeakOffset: number;
        heatingPeakOffset: number;
        peakLoadExclude: boolean;
        economizerSetpoint: number;
        occupancyDetection: boolean;
        configurationId: string | null;
        controlId: string | null;
        locationId: string | null;
    }>;
    readonly UnitFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "name" | "id" | "createdAt" | "updatedAt" | "message" | "stage" | "correlation" | "campus" | "building" | "system" | "timezone" | "label" | "coolingCapacity" | "compressors" | "coolingLockout" | "optimalStartLockout" | "optimalStartDeviation" | "earliestStart" | "latestStart" | "zoneLocation" | "zoneMass" | "zoneOrientation" | "zoneBuilding" | "heatPump" | "heatPumpBackup" | "economizer" | "heatPumpLockout" | "coolingPeakOffset" | "heatingPeakOffset" | "peakLoadExclude" | "economizerSetpoint" | "occupancyDetection" | "configurationId" | "controlId" | "locationId", "name" | "id" | "createdAt" | "updatedAt" | "message" | "stage" | "correlation" | "campus" | "building" | "system" | "timezone" | "label" | "coolingCapacity" | "compressors" | "coolingLockout" | "optimalStartLockout" | "optimalStartDeviation" | "earliestStart" | "latestStart" | "zoneLocation" | "zoneMass" | "zoneOrientation" | "zoneBuilding" | "heatPump" | "heatPumpBackup" | "economizer" | "heatPumpLockout" | "coolingPeakOffset" | "heatingPeakOffset" | "peakLoadExclude" | "economizerSetpoint" | "occupancyDetection" | "configurationId" | "controlId" | "locationId">;
    constructor(builder: SchemaBuilderService);
}
