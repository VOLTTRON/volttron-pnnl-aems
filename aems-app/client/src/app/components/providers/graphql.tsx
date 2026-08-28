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
      uri: `${location.protocol}//${location.host}${process.env.NEXT_PUBLIC_GRAPHQL_API || "/graphql"}`,
      credentials: "include",
    });
    const wsUrl = `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}${
      process.env.NEXT_PUBLIC_GRAPHQL_WS || "/graphql"
    }`;
    const wsLink = new GraphQLWsLink(
      createClient({
        url: wsUrl,
        connectionParams: async () => ({}),
        retryAttempts: Infinity,
        shouldRetry: () => true,
        on: {
          connected: () => console.info(`[graphql-ws] connected ${wsUrl}`),
          closed: (event) => {
            const e = event as { code?: number; reason?: string } | undefined;
            console.warn(`[graphql-ws] closed code=${e?.code ?? "?"} reason=${e?.reason ?? ""}`);
          },
          error: (error) => {
            const msg = error instanceof Error ? error.message : String(error);
            console.warn(`[graphql-ws] error ${msg}`);
          },
        },
      }),
    );
    const splitLink = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return definition.kind === "OperationDefinition" && definition.operation === "subscription";
      },
      wsLink,
      httpLink,
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
