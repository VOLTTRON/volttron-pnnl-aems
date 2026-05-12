import { Mutation } from "@local/common";
import { SubscriptionService } from "@/subscription/subscription.service";
export declare class BackupSubscriptionPublisher {
    private readonly subscriptionService;
    constructor(subscriptionService: SubscriptionService);
    publishPolicy(id: string, mutation: Mutation): Promise<void>;
    publishDestination(id: string, mutation: Mutation): Promise<void>;
    publishRun(id: string, mutation: Mutation): Promise<void>;
    publishKey(id: string, mutation: Mutation): Promise<void>;
}
