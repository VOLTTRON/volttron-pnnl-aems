import { SchemaBuilderService } from "../builder.service";
import { KeycloakAdminService } from "./keycloak-admin.service";
import { KeycloakObject } from "./object.service";
export declare class KeycloakQuery {
    constructor(builder: SchemaBuilderService, keycloakAdminService: KeycloakAdminService, keycloakObject: KeycloakObject);
}
