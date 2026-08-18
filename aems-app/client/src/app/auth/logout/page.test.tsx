import { render, screen } from "@testing-library/react";
import { CurrentContext, LoadingContext, RouteContext } from "@/app/components/providers";
import { staticRoutes } from "@/app/routes";

const mockPush = jest.fn();
const mockClearStore = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@apollo/client", () => ({
  useApolloClient: () => ({ clearStore: mockClearStore }),
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    type: "basic",
    headers: { get: () => null },
    statusText: "",
  } as unknown as Response),
);

const mockLoadingCtx = {
  loadings: [],
  createLoading: jest.fn(() => ({ id: "l1", timestamp: 0, type: 1 })),
  clearLoading: jest.fn(),
};

const mockCurrentCtx = {
  current: { id: "u1", name: "Alice", email: "alice@example.com", role: "user", image: null, emailVerified: null, preferences: null, createdAt: "", updatedAt: "" },
  loading: false,
  updateCurrent: jest.fn(),
  refetchCurrent: jest.fn(),
};

const mockRouteCtx = {
  routes: staticRoutes,
  route: undefined,
  items: [],
  resolvers: {},
  addResolver: jest.fn(),
  removeResolver: jest.fn(),
};

function renderPage() {
  const Page = require("./page").default;
  return render(
    <CurrentContext.Provider value={mockCurrentCtx}>
      <LoadingContext.Provider value={mockLoadingCtx}>
        <RouteContext.Provider value={mockRouteCtx}>
          <Page />
        </RouteContext.Provider>
      </LoadingContext.Provider>
    </CurrentContext.Provider>,
  );
}

describe("Logout page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (process.env as any).NEXT_PUBLIC_AUTHJS_LOGOUT_URL;
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the Sign out form", () => {
    renderPage();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });

  it("redirects immediately when NEXT_PUBLIC_AUTHJS_LOGOUT_URL is set", () => {
    process.env.NEXT_PUBLIC_AUTHJS_LOGOUT_URL = "https://auth.example.com/logout";
    renderPage();
    expect(mockPush).toHaveBeenCalledWith("https://auth.example.com/logout");
  });
});
