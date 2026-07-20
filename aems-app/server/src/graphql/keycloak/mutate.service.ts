import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosMutation } from "../pothos.decorator";
import { KeycloakAdminService } from "./keycloak-admin.service";

@Injectable()
@PothosMutation()
export class KeycloakMutation {
  constructor(
    builder: SchemaBuilderService,
    keycloakAdminService: KeycloakAdminService,
  ) {
    builder.mutationField("assignKeycloakRoles", (t) =>
      t.field({
        description: "Assign Keycloak realm roles (by name) to the given app user.",
        authScopes: { keycloak: true },
        type: "Boolean",
        args: {
          userId: t.arg.string({ required: true }),
          roles: t.arg.stringList({ required: true }),
        },
        resolve: async (_root, args) => {
          const keycloakUserId = await keycloakAdminService.lookupKeycloakUserId(args.userId);
          if (!keycloakUserId) throw new Error("User has no linked Keycloak account.");
          const allRoles = await keycloakAdminService.listRealmRoles();
          const toAssign = allRoles.filter((r) => args.roles.includes(r.name));
          await keycloakAdminService.assignRoles(keycloakUserId, toAssign);
          return true;
        },
      }),
    );

    builder.mutationField("revokeKeycloakRoles", (t) =>
      t.field({
        description: "Revoke Keycloak realm roles (by name) from the given app user.",
        authScopes: { keycloak: true },
        type: "Boolean",
        args: {
          userId: t.arg.string({ required: true }),
          roles: t.arg.stringList({ required: true }),
        },
        resolve: async (_root, args) => {
          const keycloakUserId = await keycloakAdminService.lookupKeycloakUserId(args.userId);
          if (!keycloakUserId) throw new Error("User has no linked Keycloak account.");
          const currentRoles = await keycloakAdminService.getUserRoles(keycloakUserId);
          const toRevoke = currentRoles.filter((r) => args.roles.includes(r.name));
          await keycloakAdminService.revokeRoles(keycloakUserId, toRevoke);
          return true;
        },
      }),
    );

    builder.mutationField("grantKeycloakAdminAccess", (t) =>
      t.field({
        description: "Grant Keycloak admin console access to the given app user (assigns the configured realm-management client role).",
        authScopes: { keycloak: true },
        type: "Boolean",
        args: {
          userId: t.arg.string({ required: true }),
        },
        resolve: async (_root, args) => {
          await keycloakAdminService.syncAdminRole(args.userId, true);
          return true;
        },
      }),
    );

    builder.mutationField("revokeKeycloakAdminAccess", (t) =>
      t.field({
        description: "Revoke Keycloak admin console access from the given app user.",
        authScopes: { keycloak: true },
        type: "Boolean",
        args: {
          userId: t.arg.string({ required: true }),
        },
        resolve: async (_root, args) => {
          await keycloakAdminService.syncAdminRole(args.userId, false);
          return true;
        },
      }),
    );
  }
}
