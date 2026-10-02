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
import { SubscriptionModule } from "@/subscription/subscription.module";
import { AppConfigService } from "@/app.config";
import { AuthModule } from "@/auth/auth.module";
import { InfoLogger } from "@/logging";
import { WebSocketAuthService } from "@/auth/websocket.service";
import { FrameworkModule } from "@/auth/framework.module";
import { graphqlConnection } from "./connection";

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
            const { context, onConnect } = graphqlConnection(
              wsAuthService,
              new InfoLogger(`${PothosGraphQLModule.name}:ws`),
            );
            return ({
            context,
            subscriptions: {
              "graphql-ws": {
                path: "/graphql",
                onConnect,
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
