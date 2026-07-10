import { hashSync } from "@node-rs/bcrypt";
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
              if (Array.isArray(args.data)) {
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

    // Build a DATABASE_URL from the individual config fields so that the
    // password read via readSecret() (Docker secret file > env var) takes
    // precedence over whatever is baked into prisma/.env at image build time.
    const { host, port, name, schema, username, password } = configService.database;
    const connLimit = 5;
    const datasourceUrl = host && name && username && password
      ? `postgresql://${username}:${encodeURIComponent(password)}@${host}:${port}/${name}?schema=${schema}&connection_limit=${connLimit}`
      : undefined;
    const datasources = datasourceUrl ? { db: { url: datasourceUrl } } : undefined;

    if (level && !prisma) {
      const prisma = new PrismaClient({
        log: [{ emit: "event", level: "query" }],
        datasources,
      });
      prisma.$on("query", (event) => {
        this.logger[level](event, "Prisma Query");
      });
      this.prisma = extendPrisma(prisma, configService) as PrismaClient;
      this.logger.log(
        `Prisma Client configured for database (with query logging) at:  ${host}:${port}/${name}`,
      );
    } else if (!prisma) {
      this.prisma = extendPrisma(new PrismaClient({ datasources }), configService) as PrismaClient;
      this.logger.log(`Prisma Client configured for database at:  ${host}:${port}/${name}`);
    } else {
      this.prisma = extendPrisma(prisma, configService) as PrismaClient;
      this.logger.log(`Prisma Client configured using supplied prisma client.`);
    }
  }
}
