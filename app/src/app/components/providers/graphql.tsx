"use client";

import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { split, HttpLink } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { useMemo } from "react";

/**
 * Provider for Apollo graphql client.
 */
export function GraphqlProvider({ children }: { children: React.ReactNode }) {
  const location = useMemo(() => {
    if (typeof window === "undefined") {
      return { protocol: "http:", host: "localhost" };
    } else {
      return { protocol: window.location.protocol, host: window.location.host };
    }
  }, []);

  const client = useMemo(() => {
    const httpLink = new HttpLink({
      uri: `${location.protocol}//${location.host}/api/graphql`,
    });
    const wsLink = new GraphQLWsLink(
      createClient({
        url: `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/api/graphql`,
      })
    );
    const splitLink = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return definition.kind === "OperationDefinition" && definition.operation === "subscription";
      },
      wsLink,
      httpLink
    );
    const client =
      process.env.NODE_ENV !== "test"
        ? new ApolloClient({
            link: splitLink,
            cache: new InMemoryCache(),
          })
        : undefined;
    return client;
  }, [location]);

  if (!client) {
    return <b>Initializing the Graphql client connection...</b>;
  }

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
