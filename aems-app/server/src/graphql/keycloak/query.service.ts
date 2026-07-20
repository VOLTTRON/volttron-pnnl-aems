import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosQuery } from "../pothos.decorator";
import { KeycloakAdminService } from "./keycloak-admin.service";
import { KeycloakObject } from "./object.service";

@Injectable()
@PothosQuery()
export class KeycloakQuery {
  constructor(
    builder: SchemaBuilderService,
    keycloakAdminService: KeycloakAdminService,
    keycloakObject: KeycloakObject,
  ) {
    const { KeycloakRole } = keycloakObject;

    builder.queryField("readAvailableKeycloakRoles", (t) =>
      t.field({
        description: "List all available Keycloak realm roles.",
        authScopes: { keycloak: true },
        type: [KeycloakRole],
        resolve: async () => {
          return keycloakAdminService.listRealmRoles();
        },
      }),
    );

    builder.queryField("readKeycloakRoles", (t) =>
      t.field({
        description: "List the Keycloak realm roles assigned to the given app user.",
        authScopes: { keycloak: true },
        type: [KeycloakRole],
        args: {
          userId: t.arg.string({ required: true }),
        },
        resolve: async (_root, args) => {
          const keycloakUserId = await keycloakAdminService.lookupKeycloakUserId(args.userId);
          if (!keycloakUserId) return [];
          return keycloakAdminService.getUserRoles(keycloakUserId);
        },
      }),
    );

    builder.queryField("readKeycloakAdminAccess", (t) =>
      t.field({
        description: "Returns true if the given app user has Keycloak admin console access (realm-management client role).",
        authScopes: { keycloak: true },
        type: "Boolean",
        args: {
          userId: t.arg.string({ required: true }),
        },
        resolve: async (_root, args) => {
          return keycloakAdminService.hasAdminAccess(args.userId);
        },
      }),
    );
  }
}
