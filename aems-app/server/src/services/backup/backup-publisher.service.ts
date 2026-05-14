import { Injectable } from "@nestjs/common";
import { Mutation } from "@local/common";
import { SubscriptionService } from "@/subscription/subscription.service";

/**
 * Centralized pub/sub helpers for the four backup aggregates. Any code that
 * mutates a BackupPolicy / BackupDestination / BackupRun / BackupKey row
 * MUST route its publish call through this provider, so we never again end
 * up with a second write path (the sidecar worker) silently skipping the
 * subscription layer.
 *
 * Topic strings mirror the Prisma ModelName union in @local/prisma, plus a
 * per-id suffix for single-row subscribers.
 */
@Injectable()
export class BackupSubscriptionPublisher {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  async publishPolicy(id: string, mutation: Mutation): Promise<void> {
    await this.subscriptionService.publish("BackupPolicy", { topic: "BackupPolicy", id, mutation });
    await this.subscriptionService.publish(`BackupPolicy/${id}`, { topic: "BackupPolicy", id, mutation });
  }

  async publishDestination(id: string, mutation: Mutation): Promise<void> {
    await this.subscriptionService.publish("BackupDestination", { topic: "BackupDestination", id, mutation });
    await this.subscriptionService.publish(`BackupDestination/${id}`, {
      topic: "BackupDestination",
      id,
      mutation,
    });
  }

  async publishRun(id: string, mutation: Mutation): Promise<void> {
    await this.subscriptionService.publish("BackupRun", { topic: "BackupRun", id, mutation });
    await this.subscriptionService.publish(`BackupRun/${id}`, { topic: "BackupRun", id, mutation });
  }

  async publishKey(id: string, mutation: Mutation): Promise<void> {
    await this.subscriptionService.publish("BackupKey", { topic: "BackupKey", id, mutation });
    await this.subscriptionService.publish(`BackupKey/${id}`, { topic: "BackupKey", id, mutation });
  }
}
