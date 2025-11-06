import { hashSync } from "@node-rs/bcrypt";
import { isArray } from "lodash";
import { PrismaClient } from "@prisma/client";
import { checkPassword } from "@/auth";
import { getLogLevel } from "@/logging";
import { Inject, Logger, Optional } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { AppConfigService } from "@/app.config";

const processPassword = (password: string, validate: boolean, strength: number) => {
  const result = checkPassword(password);
  if (validate && result.feedback.warning) {
    throw new Error(result.feedback.warning);
  }
  if (result.score < strength) {
    throw new Error("Password does not meet minimum strength requirements.");
  }
  return hashSync(password, 10);
};

const extendPrisma = <T extends PrismaClient>(prisma: T, configService: AppConfigService) => {
  return prisma.$extends({
    query: {
      user: {
        $allOperations({ operation, args, query }) {
          switch (operation) {
            case "create":
            case "update":
              if (typeof args.data.password === "string") {
                args.data.password = processPassword(
                  args.data.password,
                  configService.password.validate,
                  configService.password.strength,
                );
              }
              break;
            case "upsert":
              if (typeof args.create.password === "string") {
                args.create.password = processPassword(
                  args.create.password,
                  configService.password.validate,
                  configService.password.strength,
                );
              }
              if (typeof args.update.password === "string") {
                args.update.password = processPassword(
                  args.update.password,
                  configService.password.validate,
                  configService.password.strength,
                );
              }
              break;
            case "createMany":
            case "updateMany":
              if (isArray(args.data)) {
                args.data.forEach((v) => {
                  if (typeof v.password === "string") {
                    v.password = processPassword(
                      v.password,
                      configService.password.validate,
                      configService.password.strength,
                    );
                  }
                });
              } else {
                if (typeof args.data.password === "string") {
                  args.data.password = processPassword(
                    args.data.password,
                    configService.password.validate,
                    configService.password.strength,
                  );
                }
              }
              break;
            default:
          }
          return query(args);
        },
      },
    },
  });
};

@Injectable()
export class PrismaService {
  // magic string necessary because class name is minified
  private logger = new Logger("PrismaClient");
  readonly prisma: PrismaClient;

  constructor(@Inject(AppConfigService.Key) configService: AppConfigService, @Optional() prisma?: PrismaClient) {
    const level = getLogLevel(configService.log.prisma.level);
    if (level && !prisma) {
      const prisma = new PrismaClient({
        log: [
          {
            emit: "event",
            level: "query",
          },
        ],
      });
      prisma.$on("query", (event) => {
        this.logger[level](event, "Prisma Query");
      });
      this.prisma = extendPrisma(prisma, configService) as PrismaClient;
      this.logger.log(
        `Prisma Client configured for database (with query logging) at:  ${configService.database.url.split("@").pop()}`,
      );
    } else if (!prisma) {
      this.prisma = extendPrisma(new PrismaClient(), configService) as PrismaClient;
      this.logger.log(`Prisma Client configured for database at:  ${configService.database.url.split("@").pop()}`);
    } else {
      this.prisma = extendPrisma(prisma, configService) as PrismaClient;
      this.logger.log(`Prisma Client configured using supplied prisma client.`);
    }
  }
}
