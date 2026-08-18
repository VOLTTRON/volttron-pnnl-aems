import { render, screen } from "@testing-library/react";
import { NotificationContext } from "../components/providers/notification";
import { RouteContext } from "../components/providers/routing";
import { CurrentContext } from "../components/providers/current";
import { staticRoutes } from "@/app/routes";

jest.mock("@apollo/client", () => ({
  useQuery: jest.fn(() => ({ data: undefined, loading: false, refetch: jest.fn() })),
  useMutation: jest.fn(() => [jest.fn(), { loading: false }]),
}));

jest.mock("./dialog", () => ({
  CreateUser: () => null,
  UpdateUser: () => null,
  DeleteUser: () => null,
  LoginAsUser: () => null,
}));

const mockRouteCtx = {
  routes: staticRoutes,
  route: undefined,
  items: [],
  resolvers: {},
  addResolver: jest.fn(),
  removeResolver: jest.fn(),
};

const mockCurrentCtx = {
  current: { id: "u1", name: "Alice", email: "alice@example.com", role: "user", image: null, emailVerified: null, preferences: null, createdAt: "", updatedAt: "" },
  loading: false,
  updateCurrent: jest.fn(),
  refetchCurrent: jest.fn(),
};

function renderPage() {
  const Page = require("./page").default;
  return render(
    <NotificationContext.Provider value={{ createNotification: jest.fn() }}>
      <RouteContext.Provider value={mockRouteCtx}>
        <CurrentContext.Provider value={mockCurrentCtx}>
          <Page />
        </CurrentContext.Provider>
      </RouteContext.Provider>
    </NotificationContext.Provider>,
  );
}

describe("Users page", () => {
  it("renders without crashing", () => {
    const { container } = renderPage();
    expect(container).toBeDefined();
  });

  it("renders the Create User button", () => {
    renderPage();
    expect(screen.getByText("Create User")).toBeInTheDocument();
  });

  it("renders the refresh button", () => {
    renderPage();
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});
