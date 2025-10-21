import { PubSubEngineExt } from "../graphql";
import { RedisPubSub } from "graphql-redis-subscriptions";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { PubSub } from "graphql-subscriptions";
import { PrismaPubSub } from "@/prisma";
import { PrismaService } from "@/prisma/prisma.service";
import { PubSubAsyncIterableIterator } from "graphql-subscriptions/dist/pubsub-async-iterable-iterator";
import { SubscriptionEvent, SubscriptionTopic } from "@local/common";
import { AppConfigService } from "@/app.config";

class PubSubExt extends PubSub implements PubSubEngineExt {
  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    return super.asyncIterableIterator<T>(triggers);
  }
}

@Injectable()
export class SubscriptionService implements PubSubEngineExt {
  private instance: PubSubEngineExt;

  constructor(prismaService: PrismaService, @Inject(AppConfigService.Key) configService: AppConfigService) {
    const logger = new Logger(SubscriptionService.name);
    switch (configService.graphql.pubsub) {
      case "redis":
      case "ioredis":
        this.instance = new RedisPubSub({
          connection: {
            host: configService.redis.host,
            port: configService.redis.port,
            retryStrategy: (n: number) => {
              // reconnect after
              return Math.min(n * 50, 2000);
            },
          },
        });
        logger.log("Setup Redis GraphQL subscription connection");
        break;
      case "prisma":
      case "database":
      case "postgres":
      case "postgresql":
        this.instance = new PrismaPubSub({ prisma: prismaService.prisma });
        logger.log("Setup Prisma GraphQL subscription connection");
        break;
      case "memory":
      case "":
      case undefined:
        this.instance = new PubSubExt();
        logger.log("Setup in-memory GraphQL subscription connection");
        if (configService.nodeEnv === "production") {
          logger.warn("The in-memory GraphQL subscription connection is not recommended for production.");
        }
        break;
      default:
        this.instance = new PubSubExt();
        logger.warn(`Unknown GraphQL subscription type specified: ${configService.graphql.pubsub}`);
        break;
    }
  }

  publish<T extends SubscriptionTopic>(
    triggerName: T | `${T}/${string}`,
    payload: SubscriptionEvent<T>,
  ): Promise<void> {
    return this.instance.publish(triggerName, payload);
  }

  subscribe<T extends SubscriptionTopic>(
    triggerName: T | `${T}/${string}`,
    onMessage: (event: SubscriptionEvent<T>) => Promise<void> | void,
    options: object,
  ): Promise<number> {
    return this.instance.subscribe(triggerName, onMessage, options);
  }

  unsubscribe(subId: number): void {
    return this.instance.unsubscribe(subId);
  }

  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    return this.instance.asyncIterator<T>(triggers);
  }

  asyncIterableIterator<T>(triggers: string | readonly string[]): PubSubAsyncIterableIterator<T> {
    return this.instance.asyncIterableIterator<T>(triggers);
  }
}
