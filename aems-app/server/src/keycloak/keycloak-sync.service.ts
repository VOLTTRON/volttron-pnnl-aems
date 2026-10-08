import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { BaseService } from "@/services";
import { Mutation, SubscriptionEvent } from "@local/common";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, Timeout } from "@nestjs/schedule";
import { Unit, User } from "@prisma/client";
import { DashboardConfigFile, readDashboardConfigs } from "@/grafana/read-dashboard-configs";

// Keycloak API types
interface KeycloakUser {
  id: string;
  username: string;
  email: string;
  enabled: boolean;
}

interface KeycloakRole {
  id: string;
  name: string;
  description?: string;
  composite: boolean;
  clientRole: boolean;
  containerId: string;
}

interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

interface SyncResult {
  email: string;
  added: string[];
  removed: string[];
  total: number;
  skipped?: boolean;
  reason?: string;
}

@Injectable()
export class KeycloakSyncService extends BaseService {
  private logger = new Logger(KeycloakSyncService.name);
  private dashboardRoles: Map<string, Set<string>> = new Map();
  private lastConfigs: DashboardConfigFile[] = [];
  private subscriptionId?: number;
  private adminTokenCache?: { token: string; expiresAt: number };
  private clientUuidCache?: string;

  constructor(
    @Inject(AppConfigService.Key) private configService: AppConfigService,
    private prismaService: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {
    super("grafana", configService);
  }

  @Timeout(1000)
  execute(): Promise<void> {
    return super.execute();
  }

  async task() {
    this.logger.log("Initializing KeycloakSyncService...");

    // Load dashboard roles on startup
    await this.loadDashboardRoles();

    // Subscribe to User update events
    await this.subscribeToUserEvents();

    // Sync all users on startup
    this.logger.log("Performing startup sync of all users...");
    await this.syncAllUsers();
    this.logger.log("Startup sync completed");
  }

  /**
   * Daily scheduled sync - runs at midnight every day
   * Ensures Keycloak roles stay in sync even if events were missed
   */
  @Cron("0 0 * * *")
  async dailySync() {
    if (!this.schedule()) {
      return;
    }

    try {
      this.logger.log("Running daily scheduled sync of all users...");
      await this.syncAllUsers();
      this.logger.log("Daily sync completed successfully");
    } catch (error) {
      this.logger.error(
        "Daily sync failed:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Subscribe to User update events via SubscriptionService
   */
  private async subscribeToUserEvents(): Promise<void> {
    try {
      this.subscriptionId = await this.subscriptionService.subscribe(
        "User",
        this.handleUserEvent.bind(this),
        {},
      );
      this.logger.log("Successfully subscribed to User events for Keycloak role sync");
    } catch (error) {
      this.logger.error("Failed to subscribe to User events:", error);
    }
  }

  /**
   * Handle User subscription events
   */
  private async handleUserEvent(event: SubscriptionEvent<"User">) {
    try {
      if (event.mutation === Mutation.Created) {
        // Handle newly created users
        await this.handleUserCreated(event.id);
      } else if (event.mutation === Mutation.Updated) {
        // Handle user updates
        await this.handleUserUpdated(event.id);
      } else if (event.mutation === Mutation.Deleted) {
        // Handle user deletion
        this.handleUserDeleted(event.id);
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle ${event.mutation} event for user ${event.id}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Handle newly created user - sync roles if they have role/units assigned
   */
  private async handleUserCreated(userId: string): Promise<void> {
    const user = await this.prismaService.prisma.user.findUnique({
      where: { id: userId },
      include: { units: true },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found after creation event`);
      return;
    }

    this.logger.log(`User created: ${user.email}, syncing Keycloak roles...`);

    // Only sync if user has a role or units assigned
    const hasRole = user.role && user.role.trim().length > 0;
    const hasUnits = user.units && user.units.length > 0;

    if (!hasRole && !hasUnits) {
      this.logger.debug(`User ${user.email} has no role or units, skipping initial sync`);
      return;
    }

    await this.syncUserRoles(user.email);
    this.logger.log(`Successfully synced Keycloak roles for new user ${user.email}`);
  }

  /**
   * Handle user update - sync roles based on changes
   */
  private async handleUserUpdated(userId: string): Promise<void> {
    const user = await this.prismaService.prisma.user.findUnique({
      where: { id: userId },
      include: { units: true },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found for Keycloak sync`);
      return;
    }

    this.logger.log(`User updated: ${user.email}, syncing Keycloak roles...`);

    await this.syncUserRoles(user.email);

    this.logger.log(`Successfully synced Keycloak roles for ${user.email}`);
  }

  /**
   * Handle user deletion - remove all Grafana roles from Keycloak
   */
  private handleUserDeleted(userId: string): void {
    // Note: The user is already deleted from database, so we can't query by ID
    // We'll need to rely on the subscription event having email information,
    // or we could maintain a cache, but for now we'll log and skip
    // The startup sync will eventually clean up any orphaned roles
    this.logger.log(
      `User ${userId} deleted - Keycloak roles will be cleaned up on next startup sync`,
    );

    // Future enhancement: If SubscriptionEvent includes email, we could:
    // 1. Get user from Keycloak by email
    // 2. Get Grafana client UUID
    // 3. Get all current roles
    // 4. Remove all Grafana roles
    // For now, relying on startup sync is acceptable since deleted users
    // losing database access is the primary concern, and Grafana roles
    // without corresponding users are harmless
  }

  /**
   * Sync all users on startup - handles database changes made outside GraphQL
   */
  private async syncAllUsers(): Promise<void> {
    try {
      const users = await this.prismaService.prisma.user.findMany({
        select: { email: true },
      });

      this.logger.log(`Found ${users.length} users to sync`);

      let succeeded = 0;
      let failed = 0;

      for (const user of users) {
        try {
          await this.syncUserRoles(user.email);
          succeeded++;
        } catch (error) {
          failed++;
          this.logger.warn(
            `Failed to sync ${user.email} on startup:`,
            error instanceof Error ? error.message : String(error),
          );
        }
      }

      this.logger.log(`Startup sync results: ${succeeded} succeeded, ${failed} failed`);
    } catch (error) {
      this.logger.error("Failed to perform startup sync:", error);
    }
  }

  async loadDashboardRoles(): Promise<void> {
    const configPath = this.configService.grafana.configPath;
    if (!configPath) {
      this.logger.warn("Grafana config path not set, dashboard roles will be empty");
      this.dashboardRoles = new Map();
      this.lastConfigs = [];
      return;
    }

    try {
      this.lastConfigs = await readDashboardConfigs(configPath, this.logger);
      const roleMap = new Map<string, Set<string>>();
      for (const file of this.lastConfigs) {
        const key = `${file.campus}_${file.building}`;
        const roles = new Set<string>();
        for (const entry of file.entries) {
          if (entry.keycloakRole) roles.add(entry.keycloakRole);
        }
        if (roles.size > 0) {
          roleMap.set(key, roles);
          this.logger.debug(`Loaded ${roles.size} roles for ${key}`);
        }
      }
      this.dashboardRoles = roleMap;
      const totalRoles = Array.from(this.dashboardRoles.values()).reduce(
        (sum, roles) => sum + roles.size,
        0,
      );
      this.logger.log(
        `Loaded ${totalRoles} Grafana roles from ${this.dashboardRoles.size} campus/building configs`,
      );
    } catch (error) {
      this.logger.error("Failed to load dashboard roles:", error);
      this.dashboardRoles = new Map();
      this.lastConfigs = [];
    }
  }

  /**
   * Main sync method - synchronize user's Keycloak roles based on database state
   */
  async syncUserRoles(email: string): Promise<SyncResult> {
    // Re-read dashboard configs before every sync so a file written after
    // start is seen without a restart.
    await this.loadDashboardRoles();

    // 1. Get user from database with role and units
    const user = await this.prismaService.prisma.user.findUnique({
      where: { email },
      include: { units: true },
    });

    if (!user) {
      throw new Error(`User not found: ${email}`);
    }

    // 2. Determine required Keycloak roles
    const requiredRoles = this.determineRequiredRoles(user);

    this.logger.debug(`Required roles for ${email}: ${requiredRoles.join(", ")}`);

    // 3. Get user from Keycloak
    const keycloakUser = await this.getKeycloakUser(email);
    if (!keycloakUser) {
      this.logger.warn(`User ${email} not found in Keycloak, skipping sync`);
      return {
        email,
        added: [],
        removed: [],
        total: 0,
        skipped: true,
        reason: "User not in Keycloak",
      };
    }

    // 4. Get current roles
    const clientUuid = await this.getGrafanaClientUuid();
    const currentRoles = await this.getUserClientRoles(keycloakUser.id, clientUuid);

    this.logger.debug(`Current roles for ${email}: ${currentRoles.join(", ")}`);

    // 5. Calculate diff. A sync that read no config removes nothing: if the
    // configs are empty we skip the removal step so a transient read miss
    // cannot wipe a user's existing Grafana roles.
    const rolesToAdd = requiredRoles.filter((r) => !currentRoles.includes(r));
    const rolesToRemove =
      this.lastConfigs.length === 0
        ? []
        : currentRoles.filter((r) => !requiredRoles.includes(r));

    this.logger.log(
      `Syncing roles for ${email}: +${rolesToAdd.length} -${rolesToRemove.length}`,
    );

    // 6. Apply changes
    for (const roleName of rolesToAdd) {
      try {
        await this.assignClientRole(keycloakUser.id, clientUuid, roleName);
        this.logger.debug(`Assigned role ${roleName} to ${email}`);
      } catch (error) {
        this.logger.error(`Failed to assign role ${roleName} to ${email}:`, error);
      }
    }

    for (const roleName of rolesToRemove) {
      try {
        await this.removeClientRole(keycloakUser.id, clientUuid, roleName);
        this.logger.debug(`Removed role ${roleName} from ${email}`);
      } catch (error) {
        this.logger.error(`Failed to remove role ${roleName} from ${email}:`, error);
      }
    }

    return {
      email,
      added: rolesToAdd,
      removed: rolesToRemove,
      total: requiredRoles.length,
    };
  }

  determineRequiredRoles(user: User & { units: Unit[] }): string[] {
    const userRoles = (user.role || "").toLowerCase().split(/\s+/).map((r) => r.trim()).filter(Boolean);
    const hasUserRole = userRoles.includes("user");
    const hasAdminRole = userRoles.includes("admin");

    if (!hasUserRole && !hasAdminRole) {
      this.logger.debug(`User ${user.email} has no user or admin role, no Grafana access`);
      return [];
    }

    if (hasAdminRole) {
      const all = new Set<string>();
      for (const file of this.lastConfigs) {
        for (const entry of file.entries) {
          if (entry.keycloakRole) all.add(entry.keycloakRole);
        }
      }
      this.logger.debug(`User ${user.email} is admin, granting ${all.size} viewer roles`);
      return Array.from(all);
    }

    const roles = new Set<string>();
    for (const unit of user.units) {
      const campus = unit.campus.toLowerCase();
      const building = unit.building.toLowerCase();
      const name = unit.name.toLowerCase();
      const file = this.lastConfigs.find((f) => f.campus === campus && f.building === building);
      if (!file) continue;
      for (const entry of file.entries) {
        if (!entry.keycloakRole) continue;
        if (entry.key.toLowerCase() === "site overview") {
          roles.add(entry.keycloakRole);
          continue;
        }
        const match = /^rtu overview - (?<n>.+)$/i.exec(entry.key);
        if (match && match.groups?.n.toLowerCase() === name) {
          roles.add(entry.keycloakRole);
        }
      }
    }
    return Array.from(roles);
  }

  /**
   * Get Keycloak base URL from issuer URL
   */
  private getKeycloakBaseUrl(): string {
    // Use internal URL if provided (for container-to-container communication)
    const internalUrl = process.env.KEYCLOAK_INTERNAL_URL;
    if (internalUrl) {
      return internalUrl;
    }
    
    // Fallback to extracting from issuer URL (for external access)
    const issuerUrl = this.configService.keycloak.issuerUrl;
    // From: http://localhost:8080/auth/sso/realms/default
    // Extract: http://localhost:8080/auth/sso
    const match = issuerUrl.match(/^(https?:\/\/[^/]+(?:\/[^/]+)*?)\/realms\//);
    return match ? match[1] : issuerUrl.replace(/\/realms\/.*$/, "");
  }

  /**
   * Get admin access token from Keycloak
   */
  private async getAdminToken(): Promise<string> {
    // Check cache
    if (this.adminTokenCache && this.adminTokenCache.expiresAt > Date.now()) {
      return this.adminTokenCache.token;
    }

    const baseUrl = this.getKeycloakBaseUrl();
    const tokenUrl = `${baseUrl}/realms/master/protocol/openid-connect/token`;

    const params = new URLSearchParams({
      grant_type: "password",
      client_id: "admin-cli",
      username: process.env.KEYCLOAK_ADMIN || "",
      password: process.env.KEYCLOAK_ADMIN_PASSWORD || "",
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`Failed to get Keycloak admin token: ${response.statusText}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data: KeycloakTokenResponse = await response.json();

    // Cache token (expire 30 seconds before actual expiry)
    this.adminTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 30) * 1000,
    };

    return data.access_token;
  }

  /**
   * Get user from Keycloak by email
   */
  private async getKeycloakUser(email: string): Promise<KeycloakUser | null> {
    const token = await this.getAdminToken();
    const realm = process.env.KEYCLOAK_REALM || "default";
    const baseUrl = this.getKeycloakBaseUrl();
    const url = `${baseUrl}/admin/realms/${realm}/users?email=${encodeURIComponent(email)}&exact=true`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to get Keycloak user: ${response.statusText}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const users: KeycloakUser[] = await response.json();
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Get Grafana OAuth client UUID
   */
  private async getGrafanaClientUuid(): Promise<string> {
    // Check cache
    if (this.clientUuidCache) {
      return this.clientUuidCache;
    }

    const token = await this.getAdminToken();
    const realm = process.env.KEYCLOAK_REALM || "default";
    const clientId = process.env.KEYCLOAK_CLIENT_ID || "grafana-oauth";
    const baseUrl = this.getKeycloakBaseUrl();
    const url = `${baseUrl}/admin/realms/${realm}/clients?clientId=${encodeURIComponent(clientId)}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to get Grafana client: ${response.statusText}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const clients: Array<{ id: string; clientId: string }> = await response.json();
    if (clients.length === 0) {
      throw new Error(`Grafana OAuth client '${clientId}' not found in Keycloak`);
    }

    // Cache the UUID
    this.clientUuidCache = clients[0].id;
    return this.clientUuidCache;
  }

  /**
   * Get user's current client roles
   */
  private async getUserClientRoles(userId: string, clientUuid: string): Promise<string[]> {
    const token = await this.getAdminToken();
    const realm = process.env.KEYCLOAK_REALM || "default";
    const baseUrl = this.getKeycloakBaseUrl();
    const url = `${baseUrl}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientUuid}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Failed to get user client roles: ${response.statusText}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const roles: KeycloakRole[] = await response.json();
    return roles.map((r) => r.name);
  }

  /**
   * Create a missing client role in Keycloak
   */
  async createClientRole(
    clientUuid: string,
    roleName: string,
    description: string,
  ): Promise<boolean> {
    try {
      const token = await this.getAdminToken();
      const realm = process.env.KEYCLOAK_REALM || "default";
      const baseUrl = this.getKeycloakBaseUrl();
      const url = `${baseUrl}/admin/realms/${realm}/clients/${clientUuid}/roles`;

      const roleData = {
        name: roleName,
        description: description,
        composite: false,
        clientRole: true,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roleData),
      });

      if (response.status === 201 || response.status === 409) {
        // 201 = created successfully, 409 = already exists (race condition)
        return true;
      }

      this.logger.error(`Failed to create role '${roleName}': ${response.statusText}`);
      return false;
    } catch (error) {
      this.logger.error(`Exception creating role '${roleName}':`, error);
      return false;
    }
  }

  /**
   * Assign client role to user (with auto-creation of missing roles)
   */
  private async assignClientRole(
    userId: string,
    clientUuid: string,
    roleName: string,
  ): Promise<void> {
    const token = await this.getAdminToken();
    const realm = process.env.KEYCLOAK_REALM || "default";
    const baseUrl = this.getKeycloakBaseUrl();

    // First, try to get the role definition
    const roleUrl = `${baseUrl}/admin/realms/${realm}/clients/${clientUuid}/roles/${encodeURIComponent(roleName)}`;
    let roleResponse = await fetch(roleUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // If role doesn't exist, create it automatically
    if (roleResponse.status === 404) {
      this.logger.log(`Role '${roleName}' not found in Keycloak, creating it automatically...`);
      
      const description = `Auto-created viewer role for ${roleName}`;
      const created = await this.createClientRole(clientUuid, roleName, description);
      
      if (!created) {
        throw new Error(`Failed to auto-create role '${roleName}' in Keycloak`);
      }

      this.logger.log(`Successfully auto-created role '${roleName}'`);

      // Fetch the newly created role
      roleResponse = await fetch(roleUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    if (!roleResponse.ok) {
      throw new Error(`Role '${roleName}' not found in Keycloak after creation attempt`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const role: KeycloakRole = await roleResponse.json();

    // Assign the role to the user
    const assignUrl = `${baseUrl}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientUuid}`;
    const assignResponse = await fetch(assignUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([role]),
    });

    if (!assignResponse.ok) {
      throw new Error(`Failed to assign role '${roleName}': ${assignResponse.statusText}`);
    }
  }

  /**
   * Remove client role from user
   */
  private async removeClientRole(
    userId: string,
    clientUuid: string,
    roleName: string,
  ): Promise<void> {
    const token = await this.getAdminToken();
    const realm = process.env.KEYCLOAK_REALM || "default";
    const baseUrl = this.getKeycloakBaseUrl();

    // First, get the role definition
    const roleUrl = `${baseUrl}/admin/realms/${realm}/clients/${clientUuid}/roles/${encodeURIComponent(roleName)}`;
    const roleResponse = await fetch(roleUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!roleResponse.ok) {
      // Role doesn't exist, consider it already removed
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const role: KeycloakRole = await roleResponse.json();

    // Remove the role from the user
    const removeUrl = `${baseUrl}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientUuid}`;
    const removeResponse = await fetch(removeUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([role]),
    });

    if (!removeResponse.ok) {
      throw new Error(`Failed to remove role '${roleName}': ${removeResponse.statusText}`);
    }
  }
}
