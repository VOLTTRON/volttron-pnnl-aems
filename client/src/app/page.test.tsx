import { render } from "@testing-library/react";
import { RouteContext } from "./components/providers/routing";
import { CurrentContext } from "./components/providers/current";
import { staticRoutes } from "./routes";

const mockPush = jest.fn();
const mockNotFound = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
  notFound: () => {
    mockNotFound();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const mockRouteCtx = {
  routes: staticRoutes,
  route: undefined,
  items: [],
  resolvers: {},
  addResolver: jest.fn(),
  removeResolver: jest.fn(),
};

describe("Root page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("calls router.push when a redirect route is available", () => {
    const mockCurrentCtx = {
      current: { id: "u1", name: "Alice", email: "alice@example.com", role: "user admin", image: null, emailVerified: null, preferences: null, createdAt: "", updatedAt: "" },
      loading: false,
      updateCurrent: jest.fn(),
      refetchCurrent: jest.fn(),
    };

    const RootPage = require("./page").default;
    render(
      <RouteContext.Provider value={mockRouteCtx}>
        <CurrentContext.Provider value={mockCurrentCtx}>
          <RootPage />
        </CurrentContext.Provider>
      </RouteContext.Provider>,
    );

    expect(mockPush).toHaveBeenCalled();
  });

  it("calls notFound when no redirect route exists", () => {
    const emptyRoutes = {
      [Symbol.iterator]: function* () { /* empty */ },
      findNode: () => undefined,
    } as any;
    const emptyRouteCtx = { ...mockRouteCtx, routes: emptyRoutes };

    const mockCurrentCtx = {
      current: null,
      loading: false,
      updateCurrent: jest.fn(),
      refetchCurrent: jest.fn(),
    };

    const RootPage = require("./page").default;
    expect(() =>
      render(
        <RouteContext.Provider value={emptyRouteCtx}>
          <CurrentContext.Provider value={mockCurrentCtx}>
            <RootPage />
          </CurrentContext.Provider>
        </RouteContext.Provider>,
      ),
    ).toThrow("NEXT_NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalled();
  });
});
