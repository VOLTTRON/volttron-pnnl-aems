import type { PrismaConfig } from "prisma";

export default {
  earlyAccess: true,
  schema: "./prisma/schema/",
} satisfies PrismaConfig;
