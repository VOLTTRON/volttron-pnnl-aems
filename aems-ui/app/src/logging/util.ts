import { LogType } from "@/common";
import prisma from "@/prisma";

export const displayBanner = (message?: string, duration = 5000, timeout = 500) => {
  try {
    timeout = timeout * 2;
    const now = new Date();
    now.setMilliseconds(now.getMilliseconds() + duration);
    prisma.log.create({
      data: {
        type: LogType.BannerType.enum,
        message: message ?? "",
        expiration: now.toISOString(),
      },
    });
  } catch (_error) {
    setTimeout(() => displayBanner(message, duration, timeout), timeout);
  }
};
