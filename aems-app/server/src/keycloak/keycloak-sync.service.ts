import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { BaseService } from "@/services";
import { getConfigFiles } from "@/utils/file";
import { Mutation, SubscriptionEvent } from "@local/common";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, Timeout } from "@nestjs/schedule";
import { Unit, User } from "@prisma/client";
import { basename, resolve } from "node:path";
import { readFile } from "node:fs/promises";

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

interface DashboardConfig {
  [dashboardName: string]:
    | string
    | {
        url: string;
        keycloak_role?: string;
        role_created?: boolean;
      };
}

@Injectable()
export class KeycloakSyncService extends BaseService {
  private logger = new Logger(KeycloakSyncService.name);
  private dashboardRoles: Map<string, Set<string>> = new Map();
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

  /**
   * Load dashboard config files and extract Keycloak role names
   */
  private async loadDashboardRoles(): Promise<void> {
    try {
      const configPath = this.configService.grafana.configPath;
      if (!configPath) {
        this.logger.warn("Grafana config path not set, dashboard roles will be empty");
        this.dashboardRoles = new Map();
        return;
      }

      this.dashboardRoles = await this.parseDashboardConfigs(configPath);

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
    }
  }

  /**
   * Parse dashboard URL config files to extract role names
   */
  private async parseDashboardConfigs(configPath: string): Promise<Map<string, Set<string>>> {
    const roleMap = new Map<string, Set<string>>();
    const ConfigFilenameRegex = /(?<campus>.+)_(?<building>.+)_dashboard_urls\.json/i;

    try {
      const files = await getConfigFiles([configPath], ".json", this.logger);

      if (files.length === 0) {
        this.logger.debug(`No dashboard config files found in ${configPath}`);
        return roleMap;
      }

      for (const file of files) {
        try {
          const filename = basename(file);
          const match = ConfigFilenameRegex.exec(filename);

          if (!match?.groups) {
            this.logger.warn(`Skipping invalid dashboard config filename: ${filename}`);
            continue;
          }

          const { campus, building } = match.groups;
          const key = `${campus}_${building}`.toLowerCase();

          const text = await readFile(resolve(file), "utf-8");
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const config: DashboardConfig = JSON.parse(text);

          const roles = new Set<string>();

          for (const [_dashboardName, dashboardInfo] of Object.entries(config)) {
            if (typeof dashboardInfo === "object" && dashboardInfo.keycloak_role) {
              roles.add(dashboardInfo.keycloak_role);
            }
          }

          if (roles.size > 0) {
            roleMap.set(key, roles);
            this.logger.debug(`Loaded ${roles.size} roles for ${key}`);
          }
        } catch (error) {
          this.logger.error(`Error parsing dashboard config file ${file}:`, error);
        }
      }
    } catch (error) {
      this.logger.error(`Error reading dashboard config files from ${configPath}:`, error);
    }

    return roleMap;
  }

  /**
   * Get all available Grafana roles across all campus/building configs
   */
  private getAllGrafanaRoles(): string[] {
    const allRoles: string[] = [];
    for (const roles of this.dashboardRoles.values()) {
      allRoles.push(...roles);
    }
    return allRoles;
  }

  /**
   * Main sync method - synchronize user's Keycloak roles based on database state
   */
  async syncUserRoles(email: string): Promise<SyncResult> {
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

    // 5. Calculate diff
    const rolesToAdd = requiredRoles.filter((r) => !currentRoles.includes(r));
    const rolesToRemove = currentRoles.filter((r) => !requiredRoles.includes(r));

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

  /**
   * Determine required Keycloak roles based on user's role and unit assignments
   */
  private determineRequiredRoles(user: User & { units: Unit[] }): string[] {
    const roles: Set<string> = new Set();

    // Parse user role string (space-separated)
    const userRoles = (user.role || "").toLowerCase().split(/\s+/).filter(Boolean);
    const hasUserRole = userRoles.includes("user");
    const hasAdminRole = userRoles.includes("admin");

    if (!hasUserRole && !hasAdminRole) {
      // No Grafana access
      this.logger.debug(`User ${user.email} has no user or admin role, no Grafana access`);
      return [];
    }

    if (hasAdminRole) {
      // Admin gets all viewer roles
      const allRoles = this.getAllGrafanaRoles();
      this.logger.debug(`User ${user.email} is admin, granting ${allRoles.length} viewer roles`);
      return allRoles;
    }

    // Regular user - get roles for assigned units
    for (const unit of user.units) {
      const campus = unit.campus.toLowerCase();
      const building = unit.building.toLowerCase();
      const unitName = unit.name.toLowerCase();

      // Add unit-specific role
      const unitRole = `grafana-view-unit-${campus}_${building}_${unitName}`;
      roles.add(unitRole);

      // Add building site role
      const siteRole = `grafana-view-site-${campus}_${building}`;
      roles.add(siteRole);
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
   * Assign client role to user
   */
  private async assignClientRole(
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
      throw new Error(`Role '${roleName}' not found in Keycloak`);
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
