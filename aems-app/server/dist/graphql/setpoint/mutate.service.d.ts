import { SchemaBuilderService } from "../builder.service";
import { SetpointQuery } from "./query.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { ChangeService } from "@/change/change.service";
export declare class SetpointMutation {
    readonly SetpointCreate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.SetpointCreateInput, {
        stage: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail", "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail">;
        message: "String";
        correlation: "String";
        label: "String";
        setpoint: "Float";
        deadband: "Float";
        heating: "Float";
        cooling: "Float";
        standbyTime: "Int";
        standbyOffset: "Float";
    }>>;
    readonly SetpointUpdate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import(".prisma/client").Prisma.SetpointUpdateInput, {
        stage: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: import("..").Scalars;
        }>, "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail", "Create" | "Read" | "Update" | "Delete" | "Process" | "Complete" | "Fail">;
        message: "String";
        correlation: "String";
        label: "String";
        setpoint: "Float";
        deadband: "Float";
        heating: "Float";
        cooling: "Float";
        standbyTime: "Int";
        standbyOffset: "Float";
    }>>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, subscriptionService: SubscriptionService, setpointQuery: SetpointQuery, changeService: ChangeService);
}
