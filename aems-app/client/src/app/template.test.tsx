import { render, screen } from "@testing-library/react";
import { CurrentContext, RouteContext } from "./components/providers";
import { staticRoutes } from "@/app/routes";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ toString: () => "" }),
}));

jest.mock("./components/common", () => ({
  GlobalLoading: () => <div data-testid="global-loading" />,
  NavbarLeft: () => <div data-testid="navbar-left" />,
  NavbarRight: () => <div data-testid="navbar-right" />,
  Navigation: () => <div data-testid="navigation" />,
  LocalLoading: () => <div data-testid="local-loading" />,
}));

jest.mock("./components/feedback", () => ({
  FeedbackWidget: () => null,
}));

jest.mock("./not-found", () => ({
  __esModule: true,
  default: () => <div data-testid="not-found" />,
}));

const loginRoute = staticRoutes.findNode("login");
const backupsRoute = staticRoutes.findNode("backups");

const baseRouteCtx = {
  routes: staticRoutes,
  items: [],
  resolvers: {},
  addResolver: jest.fn(),
  removeResolver: jest.fn(),
};

const mockCurrentAdmin = {
  id: "u1",
  name: "Admin",
  email: "admin@example.com",
  role: "admin",
  image: null,
  emailVerified: null,
  preferences: null,
  createdAt: "",
  updatedAt: "",
};

function renderTemplate(
  currentCtx: object,
  routeCtx: object,
) {
  const Template = require("./template").default;
  return render(
    <CurrentContext.Provider value={currentCtx as any}>
      <RouteContext.Provider value={routeCtx as any}>
        <Template>
          <div data-testid="children">page content</div>
        </Template>
      </RouteContext.Provider>
    </CurrentContext.Provider>,
  );
}

describe("Template", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders GlobalLoading while loading", () => {
    renderTemplate(
      { current: null, loading: true },
      { ...baseRouteCtx, route: backupsRoute },
    );
    expect(screen.getByTestId("global-loading")).toBeInTheDocument();
  });

  it("renders NotFound when no route matches", () => {
    renderTemplate(
      { current: mockCurrentAdmin, loading: false },
      { ...baseRouteCtx, route: undefined },
    );
    expect(screen.getByTestId("not-found")).toBeInTheDocument();
  });

  it("redirects to denied when user lacks permission", () => {
    const userOnlyCtx = {
      current: { ...mockCurrentAdmin, role: "user" },
      loading: false,
    };
    renderTemplate(
      userOnlyCtx,
      { ...baseRouteCtx, route: backupsRoute },
    );
    expect(mockPush).toHaveBeenCalledWith("/auth/denied");
  });

  it("redirects to login when not authenticated and route requires auth", () => {
    renderTemplate(
      { current: null, loading: false },
      { ...baseRouteCtx, route: backupsRoute },
    );
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/auth/login"));
  });

  it("renders children when user is authenticated and authorized", () => {
    renderTemplate(
      { current: mockCurrentAdmin, loading: false },
      { ...baseRouteCtx, route: backupsRoute },
    );
    expect(screen.getByTestId("children")).toBeInTheDocument();
  });

  it("renders children for a public route without authentication", () => {
    renderTemplate(
      { current: null, loading: false },
      { ...baseRouteCtx, route: loginRoute },
    );
    expect(screen.getByTestId("children")).toBeInTheDocument();
  });
});
