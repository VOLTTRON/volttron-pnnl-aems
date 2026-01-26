import { Controller, Post, Body, UseGuards, Logger, InternalServerErrorException } from "@nestjs/common";
import { KeycloakSyncService } from "./keycloak-sync.service";
import { InternalNetworkGuard } from "./internal-network.guard";
import { PrismaService } from "@/prisma/prisma.service";

interface SyncRolesRequest {
  email: string;
}

interface SyncRolesResponse {
  success: boolean;
  message: string;
  result?: {
    email: string;
    added: string[];
    removed: string[];
    total: number;
    skipped?: boolean;
    reason?: string;
  };
}

interface SyncAllResponse {
  success: boolean;
  message: string;
  total: number;
  succeeded: number;
  failed: number;
  details?: Array<{
    email: string;
    status: "success" | "failed";
    error?: string;
  }>;
}

@Controller("internal/keycloak")
export class KeycloakInternalController {
  private logger = new Logger(KeycloakInternalController.name);

  constructor(
    private keycloakSyncService: KeycloakSyncService,
    private prismaService: PrismaService,
  ) {}

  @UseGuards(InternalNetworkGuard)
  @Post("sync-roles")
  async syncUserRoles(@Body() body: SyncRolesRequest): Promise<SyncRolesResponse> {
    const { email } = body;

    if (!email) {
      throw new InternalServerErrorException("Email is required");
    }

    this.logger.log(`Manual sync requested for ${email}`);

    try {
      const result = await this.keycloakSyncService.syncUserRoles(email);
      return {
        success: true,
        message: `Synced roles for ${email}`,
        result,
      };
    } catch (error) {
      this.logger.error(`Failed to sync roles for ${email}:`, error);
      throw new InternalServerErrorException(
        `Failed to sync Keycloak roles: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @UseGuards(InternalNetworkGuard)
  @Post("sync-all")
  async syncAllUsers(): Promise<SyncAllResponse> {
    this.logger.log("Bulk sync requested for all users");

    try {
      const users = await this.prismaService.prisma.user.findMany({
        select: { email: true },
      });

      this.logger.log(`Found ${users.length} users to sync`);

      const results = await Promise.allSettled(
        users.map((user) => this.keycloakSyncService.syncUserRoles(user.email)),
      );

      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      const details = results.map((result, index) => {
        if (result.status === "fulfilled") {
          return {
            email: users[index].email,
            status: "success" as const,
          };
        } else {
          return {
            email: users[index].email,
            status: "failed" as const,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          };
        }
      });

      this.logger.log(`Bulk sync completed: ${succeeded} succeeded, ${failed} failed`);

      return {
        success: true,
        message: `Synced ${succeeded} users, ${failed} failures`,
        total: users.length,
        succeeded,
        failed,
        details,
      };
    } catch (error) {
      this.logger.error("Failed to sync all users:", error);
      throw new InternalServerErrorException(
        `Failed to sync all users: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
