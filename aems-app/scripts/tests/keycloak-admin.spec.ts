import { test, expect, APIRequestContext } from "@playwright/test";
import path from "node:path";
import { appDir, hostname, psql, readEnv } from "./support/stack";

const TARGET = "test-user@skeleton.local";

/** A master-realm admin token, straight from Keycloak, to read what the app did there. */
async function keycloak(request: APIRequestContext) {
  const token = (await (
    await request.post(`https://${hostname}/auth/sso/realms/master/protocol/openid-connect/token`, {
      form: {
        grant_type: "password",
        client_id: "admin-cli",
        username: process.env.KEYCLOAK_ADMIN!,
        password: process.env.KEYCLOAK_ADMIN_PASSWORD!,
      },
    })
  ).json()) as { access_token: string };
  const get = async <T>(p: string) =>
    (await (
      await request.get(`https://${hostname}/auth/sso/admin/realms/default${p}`, {
        headers: { Authorization: `Bearer ${token.access_token}` },
      })
    ).json()) as T;
  const [management] = await get<{ id: string }[]>("/clients?clientId=realm-management");
  return (userId: string) =>
    get<{ name: string }[]>(`/users/${userId}/role-mappings/clients/${management.id}`).then((roles) => roles.map((r) => r.name));
}

// scenario: keycloak-role-mirrors-realm-admin
test("granting or revoking the keycloak role on a user grants or revokes realm-admin in Keycloak", async ({ request }) => {
  const adminRole = readEnv("KEYCLOAK_ADMIN_ROLE", path.join(appDir, "server/.env")) ?? "realm-admin";
  const [appId, keycloakId] = psql(
    "database",
    "aems",
    `SELECT u.id, a."providerAccountId" FROM "User" u JOIN "Account" a ON a."userId" = u.id AND a.provider = 'keycloak' WHERE u.email = '${TARGET}' ORDER BY a."createdAt" DESC LIMIT 1`,
  ).split("|");
  expect(keycloakId, "the target signed in through Keycloak in setup").toBeTruthy();
  const original = psql("database", "aems", `SELECT coalesce(role, '') FROM "User" WHERE id = '${appId}'`);
  const clientRoles = await keycloak(request);

  const setRole = async (role: string) => {
    const response = await request.post("/graphql", {
      data: {
        query: `mutation ($id: String!, $role: String) { updateUser(where: { id: $id }, update: { role: $role }) { id role } }`,
        variables: { id: appId, role },
      },
    });
    const body = (await response.json()) as { errors?: { message: string }[] };
    expect(body.errors).toBeUndefined();
  };

  expect(await clientRoles(keycloakId)).not.toContain(adminRole);
  try {
    await setRole("user,keycloak");
    await expect.poll(() => clientRoles(keycloakId), { timeout: 30_000 }).toContain(adminRole);
    await setRole("user");
    await expect.poll(() => clientRoles(keycloakId), { timeout: 30_000 }).not.toContain(adminRole);
  } finally {
    await setRole(original);
  }
});
