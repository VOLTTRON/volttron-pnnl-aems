import { render, screen } from "@testing-library/react";

jest.mock("graphql-ws", () => ({
  createClient: jest.fn(() => ({ dispose: jest.fn() })),
}));

jest.mock("@apollo/client", () => ({
  ApolloClient: jest.fn().mockImplementation(() => ({})),
  ApolloProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  InMemoryCache: jest.fn().mockImplementation(() => ({})),
  split: jest.fn((fn: any, a: any, b: any) => ({ split: true })),
  HttpLink: jest.fn().mockImplementation(() => ({ http: true })),
}));

jest.mock("@apollo/client/link/subscriptions", () => ({
  GraphQLWsLink: jest.fn().mockImplementation(() => ({ ws: true })),
}));

jest.mock("@apollo/client/utilities", () => ({
  getMainDefinition: jest.fn(() => ({ kind: "OperationDefinition", operation: "query" })),
}));

import { GraphqlProvider } from "./graphql";

describe("GraphqlProvider", () => {
  it("renders the initializing message in test environment (NODE_ENV=test)", () => {
    // In test env, process.env.NODE_ENV === 'test', so the ApolloClient is not
    // created and the fallback <b> is rendered instead of ApolloProvider.
    render(
      <GraphqlProvider>
        <span>child</span>
      </GraphqlProvider>,
    );
    expect(screen.getByText("Initializing the Graphql client connection...")).toBeInTheDocument();
  });

  it("does not render children when client is undefined", () => {
    render(
      <GraphqlProvider>
        <span data-testid="child">child</span>
      </GraphqlProvider>,
    );
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });
});
