import { SchemaBuilderService } from "../builder.service";
import { LocationQuery } from "./query.service";
import { LocationObject } from "./object.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { UnitQuery } from "../unit/query.service";
import { ChangeService } from "@/change/change.service";
export declare class LocationMutation {
    readonly LocationCreate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.LocationCreateInput, {
        name: "String";
        latitude: "Float";
        longitude: "Float";
        units: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.UnitCreateNestedManyWithoutLocationInput>;
    }>>;
    readonly LocationUpdate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.LocationUpdateInput, {
        name: "String";
        latitude: "Float";
        longitude: "Float";
        units: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, import(".prisma/client").Prisma.UnitUpdateManyWithoutLocationNestedInput>;
    }>>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, subscriptionService: SubscriptionService, locationQuery: LocationQuery, _locationObject: LocationObject, unitQuery: UnitQuery, changeService: ChangeService);
}
