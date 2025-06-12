import { PubSub, PubSubOptions } from "graphql-subscriptions";
import { PrismaClient } from "@prisma/client";
import { Logger } from "@nestjs/common";
import { SubscriptionEvent, SubscriptionTopic } from "@local/common";

export class PrismaPubSub extends PubSub {
  private logger = new Logger(PrismaPubSub.name);
  private prisma: PrismaClient;
  private cancel: NodeJS.Timeout | null = null;
  private running = false;
  private previous = new Date();

  constructor({ prisma, ...options }: PubSubOptions & { prisma: PrismaClient }) {
    super(options);
    this.prisma = prisma;
    this.cancel = setInterval(() => this.execute(), 1000);
  }

  execute() {
    if (this.running) {
      return;
    }
    const current = new Date();
    this.prisma.event
      .findMany({
        where: { createdAt: { gte: this.previous, lt: current } },
        orderBy: { createdAt: "asc" },
      })
      .then(async (events) => {
        await Promise.all(events.map((event) => super.publish(event.topic, event.payload)));
        this.previous = current;
      })
      .catch((error) => this.logger.error(error, "Failed to execute PrismaPubSub"))
      .finally(() => (this.running = false));
  }

  async publish<T extends SubscriptionTopic>(topic: string, payload: SubscriptionEvent<T>): Promise<void> {
    return this.prisma.event
      .create({
        data: {
          topic: topic,
          payload: payload,
        },
      })
      .then(() => undefined);
  }

  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    return super.asyncIterableIterator<T>(triggers);
  }

  [Symbol.dispose]() {
    this.cancel?.unref();
  }
}
