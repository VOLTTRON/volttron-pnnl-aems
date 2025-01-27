import { logger } from "@/logging";
import { parseBoolean } from "@/utils/util";
import { ApolloServer, ApolloServerPlugin } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import {
  ApolloServerPluginUsageReportingDisabled,
  ApolloServerPluginSchemaReportingDisabled,
} from "@apollo/server/plugin/disabled";
import { schema } from "./schema";
import { Context } from "./types";

const createApolloServer = (...plugins: ApolloServerPlugin<Context>[]) =>
  new ApolloServer<Context>({
    schema: schema,
    logger: logger,
    ...(parseBoolean(process.env.GRAPHQL_EDITOR)
      ? {
          plugins: [
            ApolloServerPluginLandingPageLocalDefault({ embed: { endpointIsEditable: false, runTelemetry: false } }),
            ApolloServerPluginUsageReportingDisabled(),
            ApolloServerPluginSchemaReportingDisabled(),
            ...plugins,
          ],
          introspection: true,
        }
      : { plugins }),
  });

export { createApolloServer };
