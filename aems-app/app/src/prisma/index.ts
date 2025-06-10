import bcrypt from "@node-rs/bcrypt";
import pino from "pino";
import { LogType } from "@/common";
import { logger } from "@/logging";
import { PrismaClient, Prisma, User } from "@prisma/client";
import checkPassword from "@/auth/checkPassword";
import { parseBoolean, typeofObject } from "@/utils/util";
import { Preferences as ClientPreferences, UserPreferences } from "@/app/components/providers";
import { SubscriptionEvent, SubscriptionTopic } from "@/graphql/types";
import { AuthUser } from "@/auth/types";
import { JsonObject, JsonValue } from "@prisma/client/runtime/library";

type PrismaGlobal = typeof globalThis & {
  _singleton_prisma?: PrismaClient;
};

declare global {
  namespace PrismaJson {
    type Preferences = UserPreferences & Partial<ClientPreferences>;
    type Event = SubscriptionEvent<SubscriptionTopic>;
  }
}

const level = LogType.parse(process.env.LOG_PRISMA_LEVEL ?? "")?.name as pino.Level | undefined;
const passwordValidate = parseBoolean(process.env.PASSWORD_VALIDATE);
const passwordStrength = parseInt(process.env.PASSWORD_STRENGTH ?? "1");

function convertToJsonValue<T extends any>(value: T): JsonValue {
  if (Array.isArray(value)) {
    return value.map((v) => convertToJsonValue(v));
  } else if (value instanceof Date) {
    return value.toISOString();
  } else if (value instanceof String) {
    return value.toString();
  } else if (value instanceof Number) {
    return value.valueOf();
  } else if (value instanceof Boolean) {
    return value.valueOf();
  } else if (typeof value === "function") {
    return Function.name;
  } else if (value === undefined || value === null) {
    return null;
  } else if (typeofObject(value)) {
    return convertToJsonObject(value);
  } else {
    return value;
  }
}

export function convertToJsonObject<T extends object>(data: T): JsonObject {
  if (typeof data === "function") {
    throw new Error("Cannot convert function to JSON object");
  }
  const copy: JsonObject = {};
  return Object.entries(data).reduce((obj, [key, value]) => {
    obj[key] = convertToJsonValue(value);
    return obj;
  }, copy);
}

export async function recordChange<T extends Prisma.ModelName>(
  mutation: "Create" | "Update",
  table: T,
  key: string,
  user: Pick<User, "id"> | User["id"] | AuthUser,
  data?: JsonObject
): Promise<any>;
export async function recordChange<T extends Prisma.ModelName>(
  mutation: "Delete",
  table: T,
  key: string,
  user: Pick<User, "id"> | User["id"] | AuthUser
): Promise<any>;
export async function recordChange<T extends Prisma.ModelName>(
  mutation: "Create" | "Update" | "Delete",
  table: T,
  key: string,
  user: Pick<User, "id"> | User["id"] | AuthUser,
  data?: JsonObject | null | undefined
): Promise<any> {
  const userId = typeof user === "object" ? user.id : user;
  return prisma.change
    .create({
      data: { table: table, key: `${key}`, mutation: mutation, data: data, user: { connect: { id: userId } } },
    })
    .catch((error) => {
      logger.error(error, `Failed to record change for ${mutation} ${table} ${key}`);
    });
}

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
              if (Array.isArray(args.data)) {
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
  // hot reload will create infinite instances
  const prismaGlobal = global as PrismaGlobal;
  if (!prismaGlobal._singleton_prisma) {
    prismaGlobal._singleton_prisma = createPrismaClient();
  }
  prisma = prismaGlobal._singleton_prisma;
}

export { prisma };
