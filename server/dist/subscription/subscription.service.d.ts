import { PubSubEngineExt } from "../graphql";
import { PrismaService } from "@/prisma/prisma.service";
import { PubSubAsyncIterableIterator } from "graphql-subscriptions/dist/pubsub-async-iterable-iterator";
import { SubscriptionEvent, SubscriptionTopic } from "@local/common";
import { AppConfigService } from "@/app.config";
export declare class SubscriptionService implements PubSubEngineExt {
    private instance;
    constructor(prismaService: PrismaService, configService: AppConfigService);
    publish<T extends SubscriptionTopic>(triggerName: T | `${T}/${string}`, payload: SubscriptionEvent<T>): Promise<void>;
    subscribe<T extends SubscriptionTopic>(triggerName: T | `${T}/${string}`, onMessage: (event: SubscriptionEvent<T>) => Promise<void> | void, options: object): Promise<number>;
    unsubscribe(subId: number): void;
    asyncIterator<T>(triggers: string | string[]): AsyncIterator<T>;
    asyncIterableIterator<T>(triggers: string | readonly string[]): PubSubAsyncIterableIterator<T>;
}
