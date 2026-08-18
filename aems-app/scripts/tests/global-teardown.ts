import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const usersFile = path.join(__dirname, "../.auth/keycloak-users.json");

const hostname = process.env.APP_HOSTNAME;
const adminUser = process.env.KEYCLOAK_ADMIN;
const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD;

if (!hostname) throw new Error("APP_HOSTNAME is required");
if (!adminUser) throw new Error("KEYCLOAK_ADMIN is required");
if (!adminPassword) throw new Error("KEYCLOAK_ADMIN_PASSWORD is required");

const baseUrl = `https://${hostname}`;

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

export default async function globalTeardown() {
  if (!fs.existsSync(usersFile)) {
    console.log("[teardown] No keycloak-users.json found; nothing to clean up.");
    return;
  }

  const userIds = JSON.parse(fs.readFileSync(usersFile, "utf-8")) as Record<string, string>;
  console.log("[teardown] Deleting test users from Keycloak...");

  const token = await getAdminToken();

  for (const [email, id] of Object.entries(userIds)) {
    const res = await fetch(
      `${baseUrl}/auth/sso/admin/realms/default/users/${id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    );
    if (res.ok || res.status === 404) {
      console.log(`  [teardown] Deleted user: ${email}`);
    } else {
      const body = await res.text();
      console.warn(`  [teardown] Failed to delete ${email} (${res.status}): ${body}`);
    }
  }

  fs.unlinkSync(usersFile);
  console.log("[teardown] Done.");
}
