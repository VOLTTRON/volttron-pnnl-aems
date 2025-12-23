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
import { omit } from "lodash";
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
        "subscriptions-transport-ws": {
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
          useFactory: (wsAuthService: WebSocketAuthService, configService: AppConfigService) => ({
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
                  // CRITICAL: This is where we properly authenticate WebSocket connections
                  // This runs during the connection_init phase, BEFORE any subscriptions are created
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  const { extra } = context;
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  const request = extra?.request as IncomingMessage | undefined;

                  if (request) {
                    try {
                      // Authenticate the WebSocket connection
                      const user = await wsAuthService.authenticateWebSocket(request as Request);

                      // Store user on the socket for later context access
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      if (extra?.socket) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        extra.socket.user = user;
                      }

                      // Also store on request for fallback
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      (request as any).user = user;

                      return true; // Allow connection
                    } catch (error) {
                      // Log error but allow connection - authorization happens at resolver level
                      console.error("WebSocket authentication error in onConnect:", error);
                      return true;
                    }
                  }

                  return true; // Allow connection even without authentication
                },
              },
              "subscriptions-transport-ws": {
                path: "/graphql",
                onConnect: async (_connectionParams: any, _websocket: any, context: any) => {
                  // Legacy protocol support with same authentication logic
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  const request = context?.request as IncomingMessage | undefined;

                  if (request) {
                    try {
                      const user = await wsAuthService.authenticateWebSocket(request as Request);
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      (request as any).user = user;
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      if (context?.socket) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        context.socket.user = user;
                      }
                      return { user }; // Return connection context
                    } catch (error) {
                      console.error("WebSocket authentication error in onConnect (legacy):", error);
                      return {}; // Allow connection without user
                    }
                  }

                  return {}; // Allow connection
                },
              },
            },
            ...omit(moduleOptionsFactory(configService), ["sortSchema", "autoSchemaFile", "subscriptions"]),
          }),
        }),
      ],
    };
  }
}
