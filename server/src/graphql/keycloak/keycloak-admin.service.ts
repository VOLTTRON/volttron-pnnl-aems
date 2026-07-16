import { Inject, Injectable, Logger } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";

interface KeycloakRole {
  id: string;
  name: string;
}

interface KeycloakClient {
  id: string;
  clientId: string;
}

@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name);

  constructor(
    @Inject(AppConfigService.Key) private configService: AppConfigService,
    private prismaService: PrismaService,
  ) {}

  private get adminBase(): string {
    const issuer = this.configService.keycloak.issuerUrl;
    return issuer.replace(/\/realms\/([^/]+)/, "/admin/realms/$1");
  }

  private get masterTokenUrl(): string {
    const issuer = this.configService.keycloak.issuerUrl;
    const base = issuer.replace(/\/realms\/[^/]+/, "");
    return `${base}/realms/master/protocol/openid-connect/token`;
  }

  async getAdminToken(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: "password",
      client_id: "admin-cli",
      username: this.configService.keycloak.admin,
      password: this.configService.keycloak.adminPassword,
    });
    const res = await fetch(this.masterTokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to obtain Keycloak admin token: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  // ── Realm roles ──────────────────────────────────────────────────────────

  async listRealmRoles(): Promise<KeycloakRole[]> {
    const token = await this.getAdminToken();
    const res = await fetch(`${this.adminBase}/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to list Keycloak realm roles: ${res.status} ${text}`);
    }
    return (await res.json()) as KeycloakRole[];
  }

  async getUserRoles(keycloakUserId: string): Promise<KeycloakRole[]> {
    const token = await this.getAdminToken();
    const res = await fetch(`${this.adminBase}/users/${keycloakUserId}/role-mappings/realm`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to list user Keycloak realm roles: ${res.status} ${text}`);
    }
    return (await res.json()) as KeycloakRole[];
  }

  async assignRoles(keycloakUserId: string, roles: KeycloakRole[]): Promise<void> {
    const token = await this.getAdminToken();
    const res = await fetch(`${this.adminBase}/users/${keycloakUserId}/role-mappings/realm`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(roles),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to assign Keycloak realm roles: ${res.status} ${text}`);
    }
  }

  async revokeRoles(keycloakUserId: string, roles: KeycloakRole[]): Promise<void> {
    const token = await this.getAdminToken();
    const res = await fetch(`${this.adminBase}/users/${keycloakUserId}/role-mappings/realm`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(roles),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to revoke Keycloak realm roles: ${res.status} ${text}`);
    }
  }

  // ── Client roles (realm-management) ──────────────────────────────────────

  /** Returns the internal UUID of the `realm-management` client. */
  private async getRealmManagementClientId(token: string): Promise<string> {
    const res = await fetch(`${this.adminBase}/clients?clientId=realm-management`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to find realm-management client: ${res.status} ${text}`);
    }
    const clients = (await res.json()) as KeycloakClient[];
    const client = clients.find((c) => c.clientId === "realm-management");
    if (!client) throw new Error("realm-management client not found in Keycloak");
    return client.id;
  }

  /** Lists all client roles under `realm-management`. */
  async listRealmManagementRoles(): Promise<KeycloakRole[]> {
    const token = await this.getAdminToken();
    const clientId = await this.getRealmManagementClientId(token);
    const res = await fetch(`${this.adminBase}/clients/${clientId}/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to list realm-management client roles: ${res.status} ${text}`);
    }
    return (await res.json()) as KeycloakRole[];
  }

  /** Returns the client roles under `realm-management` assigned to the user. */
  async getUserRealmManagementRoles(keycloakUserId: string): Promise<KeycloakRole[]> {
    const token = await this.getAdminToken();
    const clientId = await this.getRealmManagementClientId(token);
    const res = await fetch(
      `${this.adminBase}/users/${keycloakUserId}/role-mappings/clients/${clientId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to list user realm-management roles: ${res.status} ${text}`);
    }
    return (await res.json()) as KeycloakRole[];
  }

  async assignRealmManagementRoles(keycloakUserId: string, roles: KeycloakRole[]): Promise<void> {
    const token = await this.getAdminToken();
    const clientId = await this.getRealmManagementClientId(token);
    const res = await fetch(
      `${this.adminBase}/users/${keycloakUserId}/role-mappings/clients/${clientId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(roles),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to assign realm-management roles: ${res.status} ${text}`);
    }
  }

  async revokeRealmManagementRoles(keycloakUserId: string, roles: KeycloakRole[]): Promise<void> {
    const token = await this.getAdminToken();
    const clientId = await this.getRealmManagementClientId(token);
    const res = await fetch(
      `${this.adminBase}/users/${keycloakUserId}/role-mappings/clients/${clientId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(roles),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to revoke realm-management roles: ${res.status} ${text}`);
    }
  }

  // ── Admin-access helpers ──────────────────────────────────────────────────

  /**
   * Returns true if the user currently holds the configured admin role
   * (a `realm-management` client role, e.g. `realm-admin`).
   */
  async hasAdminAccess(appUserId: string): Promise<boolean> {
    const keycloakUserId = await this.lookupKeycloakUserId(appUserId);
    if (!keycloakUserId) return false;
    const assigned = await this.getUserRealmManagementRoles(keycloakUserId);
    const target = this.configService.keycloak.adminRole;
    return assigned.some((r) => r.name === target);
  }

  // ── Misc ─────────────────────────────────────────────────────────────────

  async lookupKeycloakUserId(appUserId: string): Promise<string | null> {
    const account = await this.prismaService.prisma.account.findFirst({
      where: { userId: appUserId, provider: "keycloak" },
    });
    return account?.providerAccountId ?? null;
  }

  /**
   * Grants or revokes the configured adminRole client role when the app
   * `keycloak` role is assigned or removed.
   */
  async syncAdminRole(appUserId: string, grant: boolean): Promise<void> {
    const keycloakUserId = await this.lookupKeycloakUserId(appUserId);
    if (!keycloakUserId) return;

    const targetRoleName = this.configService.keycloak.adminRole;
    const allRoles = await this.listRealmManagementRoles();
    const role = allRoles.find((r) => r.name === targetRoleName);
    if (!role) {
      this.logger.warn(
        `realm-management client role '${targetRoleName}' not found — skipping sync for user ${appUserId}`,
      );
      return;
    }

    if (grant) {
      await this.assignRealmManagementRoles(keycloakUserId, [role]);
    } else {
      await this.revokeRealmManagementRoles(keycloakUserId, [role]);
    }
  }
}
