import { logger } from "@/logging";
import { parseBoolean } from "@/utils/util";
import { ApolloServer } from "@apollo/server";
import {
    ApolloServerPluginLandingPageLocalDefault
} from "@apollo/server/plugin/landingPage/default";

import { schema } from "./schema";

const graphql = new ApolloServer({
  schema: schema,
  logger: logger,
  plugins: [...(parseBoolean(process.env.GRAPHQL_EDITOR) ? [ApolloServerPluginLandingPageLocalDefault()] : [])],
});

export default graphql;
