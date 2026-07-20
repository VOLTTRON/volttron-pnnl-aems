"use client";

import styles from "./page.module.scss";
import { Button, Card, H3, H4, Intent, MenuItem, Spinner, Switch, Tag } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";
import { useCallback, useContext, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  ReadUsersDocument,
  ReadAvailableKeycloakRolesDocument,
  ReadKeycloakRolesDocument,
  ReadKeycloakAdminAccessDocument,
  AssignKeycloakRolesDocument,
  RevokeKeycloakRolesDocument,
  GrantKeycloakAdminAccessDocument,
  RevokeKeycloakAdminAccessDocument,
} from "@/graphql-codegen/graphql";
import { NotificationContext, NotificationType } from "../components/providers";
import { keycloakAdminUrl } from "@/utils/client";

const KEYCLOAK_ADMIN_URL = keycloakAdminUrl();

type UserOption = { id: string; name: string; email: string };

export default function Page() {
  const { createNotification } = useContext(NotificationContext);
  const [selectedUser, setSelectedUser] = useState<UserOption | undefined>();

  const { data: usersData, loading: usersLoading } = useQuery(ReadUsersDocument, {
    variables: { paging: { take: 200, skip: 0 } },
    onError: (err) => createNotification?.(err.message, NotificationType.Error),
  });

  const { data: availableRolesData, loading: availableLoading } = useQuery(ReadAvailableKeycloakRolesDocument, {
    onError: (err) => createNotification?.(err.message, NotificationType.Error),
  });

  const {
    data: userRolesData,
    loading: userRolesLoading,
    refetch: refetchUserRoles,
  } = useQuery(ReadKeycloakRolesDocument, {
    variables: { userId: selectedUser?.id ?? "" },
    skip: !selectedUser,
    onError: (err) => createNotification?.(err.message, NotificationType.Error),
  });

  const {
    data: adminAccessData,
    loading: adminAccessLoading,
    refetch: refetchAdminAccess,
  } = useQuery(ReadKeycloakAdminAccessDocument, {
    variables: { userId: selectedUser?.id ?? "" },
    skip: !selectedUser,
    onError: (err) => createNotification?.(err.message, NotificationType.Error),
  });

  const [assign] = useMutation(AssignKeycloakRolesDocument, {
    onCompleted: () => void refetchUserRoles(),
    onError: (err) => createNotification?.(err.message, NotificationType.Error),
  });

  const [revoke] = useMutation(RevokeKeycloakRolesDocument, {
    onCompleted: () => void refetchUserRoles(),
    onError: (err) => createNotification?.(err.message, NotificationType.Error),
  });

  const [grantAdmin, { loading: grantingAdmin }] = useMutation(GrantKeycloakAdminAccessDocument, {
    onCompleted: () => void refetchAdminAccess(),
    onError: (err) => createNotification?.(err.message, NotificationType.Error),
  });

  const [revokeAdmin, { loading: revokingAdmin }] = useMutation(RevokeKeycloakAdminAccessDocument, {
    onCompleted: () => void refetchAdminAccess(),
    onError: (err) => createNotification?.(err.message, NotificationType.Error),
  });

  const userOptions: UserOption[] = (usersData?.readUsers ?? []).map((u) => ({
    id: u.id ?? "",
    name: u.name ?? u.email ?? "",
    email: u.email ?? "",
  }));

  const assignedRoleNames = new Set((userRolesData?.readKeycloakRoles ?? []).map((r) => r?.name ?? ""));
  const hasAdminAccess = adminAccessData?.readKeycloakAdminAccess ?? false;
  const adminToggleLoading = adminAccessLoading || grantingAdmin || revokingAdmin;

  const handleAssign = useCallback(
    (roleName: string) => {
      if (!selectedUser) return;
      void assign({ variables: { userId: selectedUser.id, roles: [roleName] } });
    },
    [assign, selectedUser],
  );

  const handleRevoke = useCallback(
    (roleName: string) => {
      if (!selectedUser) return;
      void revoke({ variables: { userId: selectedUser.id, roles: [roleName] } });
    },
    [revoke, selectedUser],
  );

  const handleToggleAdmin = useCallback(() => {
    if (!selectedUser) return;
    if (hasAdminAccess) {
      void revokeAdmin({ variables: { userId: selectedUser.id } });
    } else {
      void grantAdmin({ variables: { userId: selectedUser.id } });
    }
  }, [selectedUser, hasAdminAccess, grantAdmin, revokeAdmin]);

  return (
    <div className={styles.page}>
      <Card>
        <H3>Keycloak Administration</H3>
        <p>
          Keycloak provides single sign-on (SSO) and identity management for this application. The admin console
          uses your existing SSO session — no separate login is required provided your Keycloak account has been
          granted admin console access. Use the <strong>Admin Console Access</strong> toggle below to grant it.
        </p>
        <Button
          icon={IconNames.SHARE}
          intent={Intent.PRIMARY}
          onClick={() => window.open(KEYCLOAK_ADMIN_URL, "_blank", "noreferrer")}
        >
          Open Keycloak Admin Console
        </Button>
      </Card>

      <Card>
        <H4>Documentation</H4>
        <ul>
          <li>
            <a href="https://www.keycloak.org/documentation" target="_blank" rel="noreferrer">
              Keycloak Documentation
            </a>{" "}
            — Official guides and reference for configuring realms, clients, and users.
          </li>
          <li>
            <a href="https://www.keycloak.org/docs/latest/server_admin/" target="_blank" rel="noreferrer">
              Server Administration Guide
            </a>{" "}
            — Managing realms, users, roles, and identity providers.
          </li>
          <li>
            <a href="https://www.keycloak.org/docs/latest/securing_apps/" target="_blank" rel="noreferrer">
              Securing Applications Guide
            </a>{" "}
            — Configuring OAuth2/OIDC clients and adapters.
          </li>
        </ul>
      </Card>

      <Card>
        <H4>User Role Management</H4>
        <p>Select a user to manage their Keycloak roles and admin console access.</p>

        <Select<UserOption>
          items={userOptions}
          disabled={usersLoading}
          itemRenderer={(item, { handleClick, modifiers }) => (
            <MenuItem
              key={item.id}
              text={item.name}
              label={item.email}
              active={modifiers.active}
              onClick={handleClick}
              roleStructure="listoption"
            />
          )}
          onItemSelect={setSelectedUser}
          filterable
          itemPredicate={(query, item) =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.email.toLowerCase().includes(query.toLowerCase())
          }
          noResults={<MenuItem disabled text="No users found" roleStructure="listoption" />}
        >
          <Button icon={IconNames.USER} rightIcon={IconNames.CARET_DOWN} loading={usersLoading}>
            {selectedUser ? `${selectedUser.name} (${selectedUser.email})` : "Select a user…"}
          </Button>
        </Select>

        {selectedUser && (
          <>
            <div className={styles.adminAccessRow}>
              <div>
                <strong>Admin Console Access</strong>
                <p className={styles.adminAccessNote}>
                  Grants the <code>realm-admin</code> client role under <code>realm-management</code>, allowing
                  this user to log into the Keycloak Admin Console without a separate prompt.
                </p>
              </div>
              {adminToggleLoading ? (
                <Spinner size={16} />
              ) : (
                <Switch
                  checked={hasAdminAccess}
                  onChange={handleToggleAdmin}
                  innerLabel="off"
                  innerLabelChecked="on"
                  large
                />
              )}
            </div>

            <div className={styles.roleListHeader}>
              <strong>Realm Roles</strong>
            </div>
            <div className={styles.roleList}>
              {availableLoading || userRolesLoading ? (
                <Spinner size={16} />
              ) : (
                (availableRolesData?.readAvailableKeycloakRoles ?? []).map((role) => {
                  const name = role?.name ?? "";
                  const assigned = assignedRoleNames.has(name);
                  return (
                    <div key={role?.id ?? name} className={styles.roleRow}>
                      <Tag intent={assigned ? Intent.SUCCESS : Intent.NONE} minimal>
                        {name}
                      </Tag>
                      {assigned ? (
                        <Button
                          icon={IconNames.CROSS}
                          intent={Intent.DANGER}
                          minimal
                          small
                          onClick={() => handleRevoke(name)}
                        >
                          Revoke
                        </Button>
                      ) : (
                        <Button
                          icon={IconNames.PLUS}
                          intent={Intent.PRIMARY}
                          minimal
                          small
                          onClick={() => handleAssign(name)}
                        >
                          Assign
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
