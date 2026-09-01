import { DynamicModule, Inject, Injectable, Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { PothosApolloDriver } from "./pothos.driver";
import { ModulesContainer } from "@nestjs/core";
import { ApolloDriverConfig } from "@nestjs/apollo";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import {
  ApolloServerPluginSchemaReportingDisabled,
  ApolloServerPluginUsageReportingDisabled,
} from "@apollo/server/plugin/disabled";
import { SchemaModule } from "./schema.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { Context } from ".";
import { SubscriptionModule } from "@/subscription/subscription.module";
import { Request } from "express";
import { AppConfigService } from "@/app.config";
import { AuthModule } from "@/auth/auth.module";
import { InfoLogger } from "@/logging";
import { IncomingMessage } from "node:http";
import { WebSocketAuthService } from "@/auth/websocket.service";
import { FrameworkModule } from "@/auth/framework.module";

@Module({})
export class PothosGraphQLModule {
  static forRoot(): DynamicModule {
    const moduleOptionsFactory = (configService: AppConfigService): ApolloDriverConfig => ({
      playground: false,
      sortSchema: true,
      autoSchemaFile: configService.nodeEnv !== "production" ? "../client/schema.graphql" : undefined,
      plugins: configService.graphql.editor
        ? [
            ApolloServerPluginLandingPageLocalDefault({
              embed: { endpointIsEditable: false, runTelemetry: false },
            }),
            ApolloServerPluginUsageReportingDisabled(),
            ApolloServerPluginSchemaReportingDisabled(),
          ]
        : [],
      logger: new InfoLogger(PothosGraphQLModule.name),
      path: "graphql",
      subscriptions: {
        "graphql-ws": {
          path: "/graphql",
        },
      },
    });

    @Injectable()
    class PothosApolloDriverWrapper extends PothosApolloDriver {
      constructor(
        modulesContainer: ModulesContainer,
        @Inject(AppConfigService.Key) private configService: AppConfigService,
      ) {
        super(modulesContainer);
      }

      registerServer(options: ApolloDriverConfig): Promise<void> {
        const moduleOptions = moduleOptionsFactory(this.configService);
        return super.registerServer({
          sortSchema: moduleOptions.sortSchema,
          autoSchemaFile: moduleOptions.autoSchemaFile,
          ...options,
        });
      }
    }
    return {
      module: PothosGraphQLModule,
      imports: [
        AuthModule,
        FrameworkModule.register(),
        PrismaModule,
        SchemaModule.register(),
        SubscriptionModule,
        GraphQLModule.forRootAsync<ApolloDriverConfig>({
          driver: PothosApolloDriverWrapper,
          imports: [AuthModule, FrameworkModule.register()],
          inject: [WebSocketAuthService, AppConfigService.Key],
          useFactory: (wsAuthService: WebSocketAuthService, configService: AppConfigService) => {
            const wsLogger = new InfoLogger(`${PothosGraphQLModule.name}:ws`);
            return ({
            context: ({
              req,
              extra,
            }: {
              req?: Request;
              res?: Response;
              extra?: { socket?: WebSocket; request?: IncomingMessage };
            }): Context => {
              let user: Express.User | undefined;
              if (req?.user) {
                // HTTP request - use existing middleware user
                user = req.user;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              } else if ((extra?.socket as any)?.user) {
                // WebSocket request - user authenticated during connection_init
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                user = (extra?.socket as any)?.user as Express.User | undefined;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              } else if ((extra?.request as any)?.user) {
                // Fallback for WebSocket request - user from upgrade handler
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                user = (extra?.request as any)?.user as Express.User | undefined;
              }

              return {
                user,
              };
            },
            subscriptions: {
              "graphql-ws": {
                path: "/graphql",
                onConnect: async (context: any) => {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  const { extra } = context;
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  const request = extra?.request as IncomingMessage | undefined;

                  if (!request) {
                    wsLogger.warn("Rejecting WS connect: no upgrade request on extra");
                    return false;
                  }

                  try {
                    const user = await wsAuthService.authenticateWebSocket(request as Request);
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    if (extra?.socket) {
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      extra.socket.user = user;
                    }
                    (request as any).user = user;
                    // Anonymous connects are allowed here; per-subscription scope-auth
                    // enforces authentication at operation time.
                    wsLogger.log(user ? `WS connect: user=${(user as any).id ?? "?"}` : "WS connect: anonymous");
                    return true;
                  } catch (error) {
                    wsLogger.warn(`WS authenticateWebSocket threw: ${(error as Error)?.message ?? error}`);
                    return false;
                  }
                },
              },
            },
            ...Object.fromEntries(
              Object.entries(moduleOptionsFactory(configService)).filter(([k]) => !["sortSchema", "autoSchemaFile", "subscriptions"].includes(k))
            ),
          });
          },
        }),
      ],
    };
  }
}
