import { pubsub } from "@/graphql/pubsub";
import { Mutation } from "@/graphql/types";
import { prisma } from "@/prisma";

export const displayBanner = (message?: string, duration = 5000, timeout = 500) => {
  try {
    timeout = timeout * 2;
    const now = new Date();
    now.setMilliseconds(now.getMilliseconds() + duration);
    prisma.banner.create({
      data: {
        message: message ?? "",
        expiration: now.toISOString(),
      },
    }).then((banner) => {
      pubsub.publish("Banner", {
        topic: "Banner",
        id: banner.id,
        mutation: Mutation.Created,
      })
    });
  } catch (_error) {
    setTimeout(() => displayBanner(message, duration, timeout), timeout);
  }
};
