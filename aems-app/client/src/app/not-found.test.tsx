import { render, screen } from "@testing-library/react";
import { RouteContext } from "./components/providers/routing";
import { CurrentContext } from "./components/providers/current";
import { staticRoutes } from "./routes";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/some/unknown/path"),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
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
  current: null,
  loading: false,
  updateCurrent: jest.fn(),
  refetchCurrent: jest.fn(),
};

function renderPage() {
  const NotFound = require("./not-found").default;
  return render(
    <RouteContext.Provider value={mockRouteCtx}>
      <CurrentContext.Provider value={mockCurrentCtx}>
        <NotFound />
      </CurrentContext.Provider>
    </RouteContext.Provider>,
  );
}

describe("Not Found page", () => {
  it("renders without crashing", () => {
    const { container } = renderPage();
    expect(container).toBeDefined();
  });

  it("renders a callout", () => {
    renderPage();
    const callout = document.querySelector(".bp5-callout");
    expect(callout).toBeInTheDocument();
  });

  it("renders the page with a heading", () => {
    renderPage();
    const heading = document.querySelector(".bp5-heading");
    expect(heading).toBeInTheDocument();
  });
});
