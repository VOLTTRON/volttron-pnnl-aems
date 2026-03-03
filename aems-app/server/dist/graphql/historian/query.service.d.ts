import { SchemaBuilderService } from "../builder.service";
import { HistorianService } from "@/historian/historian.service";
import { HistorianObject } from "./object.service";
export declare class HistorianQuery {
    readonly CalculationOptionsInput: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, {
        window?: string | null | undefined;
    }>;
    constructor(builder: SchemaBuilderService, historianService: HistorianService, historianObject: HistorianObject);
}
