"use client";

import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { HttpLink } from "@apollo/client";
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
    const client =
      process.env.NODE_ENV !== "test"
        ? new ApolloClient({
            link: httpLink,
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
