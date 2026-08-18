import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authDir = path.join(__dirname, "../.auth");
const usersFile = path.join(authDir, "keycloak-users.json");

const hostname = process.env.APP_HOSTNAME;
const adminUser = process.env.KEYCLOAK_ADMIN;
const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD;

if (!hostname) throw new Error("APP_HOSTNAME is required");
if (!adminUser) throw new Error("KEYCLOAK_ADMIN is required");
if (!adminPassword) throw new Error("KEYCLOAK_ADMIN_PASSWORD is required");

const baseUrl = `https://${hostname}`;

const TEST_USERS = [
  { email: "test-user@skeleton.local", password: "TestUser1!", firstName: "Test", lastName: "User" },
  { email: "test-admin@skeleton.local", password: "TestAdmin1!", firstName: "Test", lastName: "Admin" },
];

async function getAdminToken(): Promise<string> {
  const res = await fetch(
    `${baseUrl}/auth/sso/realms/master/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: "admin-cli",
        username: adminUser!,
        password: adminPassword!,
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to get admin token (${res.status}): ${body}`);
  }
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

async function findUserByEmail(token: string, email: string): Promise<string | null> {
  const res = await fetch(
    `${baseUrl}/auth/sso/admin/realms/default/users?email=${encodeURIComponent(email)}&exact=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;
  const users = await res.json() as Array<{ id: string }>;
  return users[0]?.id ?? null;
}

async function createUser(
  token: string,
  user: { email: string; password: string; firstName: string; lastName: string },
): Promise<string> {
  const existing = await findUserByEmail(token, user.email);
  if (existing) {
    console.log(`  [setup] Reusing existing Keycloak user: ${user.email}`);
    return existing;
  }

  const res = await fetch(`${baseUrl}/auth/sso/admin/realms/default/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      username: user.email,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      enabled: true,
      emailVerified: true,
      credentials: [{ type: "password", value: user.password, temporary: false }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create user ${user.email} (${res.status}): ${body}`);
  }

  // Keycloak returns 201 with Location header containing the user ID
  const location = res.headers.get("location");
  if (!location) throw new Error(`No Location header for created user ${user.email}`);
  const id = location.split("/").at(-1)!;
  console.log(`  [setup] Created Keycloak user: ${user.email} (${id})`);
  return id;
}

export default async function globalSetup() {
  console.log("[setup] Creating test users in Keycloak...");
  fs.mkdirSync(authDir, { recursive: true });

  const token = await getAdminToken();
  const userIds: Record<string, string> = {};

  for (const user of TEST_USERS) {
    userIds[user.email] = await createUser(token, user);
  }

  fs.writeFileSync(usersFile, JSON.stringify(userIds, null, 2));
  console.log("[setup] Test users ready.");
}
