import { SchemaBuilderService } from "../builder.service";
export declare class KeycloakObject {
    readonly KeycloakRole: PothosSchemaTypes.ObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, {
        id: string;
        name: string;
    }, {
        id: string;
        name: string;
    }>;
    constructor(builder: SchemaBuilderService);
}
