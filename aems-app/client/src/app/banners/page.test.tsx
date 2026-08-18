import { render, screen } from "@testing-library/react";
import { NotificationContext } from "../components/providers/notification";
import { RouteContext } from "../components/providers/routing";
import { staticRoutes } from "@/app/routes";

jest.mock("@apollo/client", () => ({
  useQuery: jest.fn(() => ({ data: undefined, loading: false, startPolling: jest.fn(), stopPolling: jest.fn() })),
  useSubscription: jest.fn(() => ({ data: undefined })),
}));

jest.mock("./dialog", () => ({
  CreateBanner: () => null,
  UpdateBanner: () => null,
  DeleteBanner: () => null,
}));

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
    <NotificationContext.Provider value={{ createNotification: jest.fn() }}>
      <RouteContext.Provider value={mockRouteCtx}>
        <Page />
      </RouteContext.Provider>
    </NotificationContext.Provider>,
  );
}

describe("Banners page", () => {
  it("renders without crashing", () => {
    const { container } = renderPage();
    expect(container).toBeDefined();
  });

  it("renders the Create Banner button", () => {
    renderPage();
    expect(screen.getByText("Create Banner")).toBeInTheDocument();
  });

  it("renders the table", () => {
    renderPage();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
