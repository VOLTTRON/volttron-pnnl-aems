import { logger } from "@/logging";
import { PubSub } from "graphql-subscriptions";
import { RedisPubSub } from "graphql-redis-subscriptions";
import { Redis } from "ioredis";
import { PrismaPubSub } from "@/prisma/pubsub";
import { prisma } from "@/prisma";
import { PubsubEngineExt } from "./types";

const factory = (): PubsubEngineExt => {
  let temp;
  switch (process.env.GRAPHQL_PUBSUB) {
    case "redis":
      const options = {
        host: process.env.REDIS_HOST ?? "localhost",
        port: parseInt(process.env.REDIS_PORT ?? "6379"),
        retryStrategy: (n: number) => {
          // reconnect after
          return Math.min(n * 50, 2000);
        },
      };
      temp = new RedisPubSub({
        publisher: new Redis(options),
        subscriber: new Redis(options),
      });
      logger.info("Setup Redis GraphQL subscription connection");
      break;
    case "prisma":
      temp = new PrismaPubSub({ prisma: prisma });
      logger.info("Setup Prisma GraphQL subscription connection");
      break;
    case "memory":
    default:
      temp = new PubSub();
      logger.info("Setup in-memory GraphQL subscription connection");
      if (process.env.NODE_ENV === "production") {
        logger.warn("The in-memory GraphQL subscription connection is not recommended for production.");
      }
      break;
  }
  return temp;
};

const pubsub = factory();

export { pubsub };
