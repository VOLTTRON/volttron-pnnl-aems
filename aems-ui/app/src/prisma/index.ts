import bcrypt from "bcrypt";
import { isArray } from "lodash";
import pino from "pino";

import { LogType } from "@/common";
import { logger } from "@/logging";
import { PrismaClient } from "@prisma/client";
import { checkPassword } from "@/auth";
import { parseBoolean } from "@/utils/util";

type PrismaGlobal = typeof globalThis & {
  _singleton_prisma?: PrismaClient;
};

const level = LogType.parse(process.env.LOG_PRISMA_LEVEL ?? "")?.name as pino.Level | undefined;
const passwordValidate = parseBoolean(process.env.PASSWORD_VALIDATE);
const passwordStrength = parseInt(process.env.PASSWORD_STRENGTH ?? "1");

const processPassword = (password: string) => {
  const result = checkPassword(password);
  if (passwordValidate && result.feedback.warning) {
    throw new Error(result.feedback.warning);
  }
  if (result.score < passwordStrength) {
    throw new Error("Password does not meet minimum strength requirements.");
  }
  return bcrypt.hashSync(password.toString(), 10);
};

const createPrismaClient = () => {
  let _prisma = new PrismaClient(
    level
      ? {
          log: [
            {
              emit: "event",
              level: "query",
            },
          ],
        }
      : undefined
  );

  if (level) {
    _prisma.$on("query", (event) => {
      logger[level](event, "Prisma Query");
    });
  }

  _prisma = _prisma.$extends({
    query: {
      user: {
        $allOperations({ operation, args, query }) {
          switch (operation) {
            case "create":
            case "update":
              if (args.data.password) {
                args.data.password = processPassword(args.data.password.toString());
              }
              break;
            case "upsert":
              if (args.create.password) {
                args.create.password = processPassword(args.create.password);
              }
              if (args.update.password) {
                args.update.password = processPassword(args.update.password.toString());
              }
              break;
            case "createMany":
            case "updateMany":
              if (isArray(args.data)) {
                args.data.forEach((v) => {
                  if (v.password) {
                    v.password = processPassword(v.password);
                  }
                });
              } else {
                if (args.data.password) {
                  args.data.password = processPassword(args.data.password.toString());
                }
              }
              break;
            default:
          }
          return query(args);
        },
      },
    },
  }) as typeof _prisma;
  logger.info(`Prisma Client configured for database at:  ${(process.env.DATABASE_URL ?? "").split("@").pop()}`);
  return _prisma;
};

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  // hot reload will create infinate instances during
  const prismaGlobal = global as PrismaGlobal;
  if (!prismaGlobal._singleton_prisma) {
    prismaGlobal._singleton_prisma = createPrismaClient();
  }
  prisma = prismaGlobal._singleton_prisma;
}

export default prisma;
