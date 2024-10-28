import { PubSub, PubSubOptions } from "graphql-subscriptions";
import { PrismaClient } from "@prisma/client";
import { ServiceState } from "@/services/types";
import { buildOptions, Cancellable, schedule, startService } from "@/services/util";
import { logger } from "@/logging";
import { prisma } from ".";

interface PrismaPubSubState {}

interface PrismaPubSubOptions extends ServiceState<PrismaPubSubState> {}

class PrismaPubSub extends PubSub {
  private prisma: PrismaClient;
  private cancel: Cancellable | undefined;

  constructor(options?: PubSubOptions & { prisma?: PrismaClient }) {
    super(options);
    this.prisma = options?.prisma ?? new PrismaClient();
    const execute = (_options: PrismaPubSubOptions) => {
      let previous = new Date();
      return async () => {
        const current = new Date();
        const events = await prisma.event.findMany({
          where: { createdAt: { gte: previous, lt: current } },
          orderBy: { createdAt: "asc" },
        });
        await Promise.all(events.map((event) => super.publish(event.topic, event)));
        previous = current;
      };
    };

    const task = () => {
      const options: PrismaPubSubOptions = buildOptions(
        {
          schedule: "100", // ms
        },
        {}
      );
      const worker = execute(options);
      return schedule(worker, options);
    };

    if (!startService(__filename, { name: "Prisma Pubsub Service" })?.catch((error) => logger.warn(error))) {
      this.cancel = task();
    }
  }

  async publish(topic: string, payload: PrismaJson.Event): Promise<void> {
    return this.prisma.event.create({ data: { topic: topic, payload: payload } }).then(() => undefined);
  }

  [Symbol.dispose]() {
    this.cancel?.stop();
  }
}

export { PrismaPubSub };
