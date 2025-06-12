import { PubSub, PubSubOptions } from "graphql-subscriptions";
import { PrismaClient } from "@prisma/client";
import { SubscriptionEvent, SubscriptionTopic } from "@local/common";
export declare class PrismaPubSub extends PubSub {
    private logger;
    private prisma;
    private cancel;
    private running;
    private previous;
    constructor({ prisma, ...options }: PubSubOptions & {
        prisma: PrismaClient;
    });
    execute(): void;
    publish<T extends SubscriptionTopic>(topic: string, payload: SubscriptionEvent<T>): Promise<void>;
    asyncIterator<T>(triggers: string | string[]): AsyncIterator<T>;
    [Symbol.dispose](): void;
}
