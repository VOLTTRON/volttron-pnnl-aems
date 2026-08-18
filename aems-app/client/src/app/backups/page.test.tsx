import { render, screen } from "@testing-library/react";
import { NotificationContext } from "../components/providers/notification";
import { RouteContext } from "../components/providers/routing";
import { staticRoutes } from "@/app/routes";

jest.mock("@apollo/client", () => ({
  useQuery: jest.fn(() => ({ data: undefined, loading: false, startPolling: jest.fn(), stopPolling: jest.fn() })),
  useSubscription: jest.fn(() => ({ data: undefined })),
  useMutation: jest.fn(() => [jest.fn(), { loading: false }]),
}));

jest.mock("./dialog", () => ({
  CreateDestination: () => null,
  UpdateDestination: () => null,
  DeleteDestination: () => null,
  TriggerRun: () => null,
  ViewRun: () => null,
  CancelRun: () => null,
  RotateKey: () => null,
  AcknowledgeKey: () => null,
  DownloadPrivateKey: () => null,
  RunStatusTag: () => null,
  formatBytes: () => "0 B",
}));

const mockRouteCtx = {
  routes: staticRoutes,
  route: staticRoutes.findNode("backups"),
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

describe("Backups page", () => {
  it("renders without crashing", () => {
    const { container } = renderPage();
    expect(container).toBeDefined();
  });

  it("renders the Policy tab", () => {
    renderPage();
    expect(screen.getByText("Policy")).toBeInTheDocument();
  });

  it("renders the Destinations tab", () => {
    renderPage();
    expect(screen.getByText("Destinations")).toBeInTheDocument();
  });

  it("renders the Runs tab", () => {
    renderPage();
    expect(screen.getByText("Runs")).toBeInTheDocument();
  });

  it("renders the Keys tab", () => {
    renderPage();
    expect(screen.getByText("Keys")).toBeInTheDocument();
  });
});
