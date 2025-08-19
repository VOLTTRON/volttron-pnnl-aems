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
import { AuthService } from "@/auth/auth.service";

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
        PrismaModule,
        SchemaModule.register(),
        SubscriptionModule,
        AuthModule,
        GraphQLModule.forRootAsync<ApolloDriverConfig>({
          driver: PothosApolloDriverWrapper,
          imports: [AuthModule],
          inject: [AuthService, AppConfigService.Key],
          useFactory: (authService: AuthService, configService: AppConfigService) => ({
            context: ({
              req,
            }: {
              req?: Request;
              res?: Response;
              extra?: { socket?: WebSocket; request?: IncomingMessage };
            }): Context => {
              return {
                user: req?.user,
              };
            },
            ...omit(moduleOptionsFactory(configService), ["sortSchema", "autoSchemaFile"]),
          }),
        }),
      ],
    };
  }
}
