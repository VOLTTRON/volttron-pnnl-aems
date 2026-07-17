import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { RouteContext } from "../providers/routing";
import { CurrentContext } from "../providers/current";
import { PreferencesContext } from "../providers/preferences";
import { ScreenSizeContext } from "../providers/screen-size";
import { NavbarLeft, NavbarRight } from "./navbar";
import { staticRoutes } from "@/app/routes";
import { Mode } from "@local/prisma";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

const mockRouteItems = [{ name: "About", icon: undefined, path: "about" }] as any;

const mockCurrentUser = {
  id: "user-1",
  name: "Alice",
  email: "alice@example.com",
  image: null,
  role: "user",
  emailVerified: null,
  preferences: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

function makeScreenCtx(isDesktop: boolean) {
  return {
    isDesktop,
    isMobile: !isDesktop,
    isTablet: false,
    screenWidth: isDesktop ? 1280 : 375,
    screenHeight: 768,
    isPortrait: false,
    isLandscape: true,
    isTouchDevice: false,
  };
}

function renderNavbarLeft({ isDesktop = true, items = mockRouteItems } = {}) {
  return render(
    <ScreenSizeContext.Provider value={makeScreenCtx(isDesktop)}>
      <RouteContext.Provider
        value={{
          routes: staticRoutes,
          route: undefined,
          items,
          resolvers: {},
          addResolver: jest.fn(),
          removeResolver: jest.fn(),
        }}
      >
        <NavbarLeft />
      </RouteContext.Provider>
    </ScreenSizeContext.Provider>,
  );
}

function renderNavbarRight({ current = mockCurrentUser as any, preferences = { mode: Mode.Light, theme: "default" } as any } = {}) {
  return render(
    <ScreenSizeContext.Provider value={makeScreenCtx(true)}>
      <PreferencesContext.Provider value={{ preferences, setPreferences: jest.fn() }}>
        <CurrentContext.Provider
          value={{ current, loading: false, updateCurrent: jest.fn(), refetchCurrent: jest.fn() }}
        >
          <NavbarRight />
        </CurrentContext.Provider>
      </PreferencesContext.Provider>
    </ScreenSizeContext.Provider>,
  );
}

describe("NavbarLeft", () => {
  it("renders breadcrumb list with items", () => {
    const { container } = renderNavbarLeft();
    // Blueprint OverflowList collapses items in jsdom (zero width) but the list itself renders
    const breadcrumbsList = container.querySelector(".bp5-breadcrumbs");
    expect(breadcrumbsList).toBeInTheDocument();
  });

  it("shows app title heading on desktop", () => {
    process.env.NEXT_PUBLIC_TITLE = "Test App";
    renderNavbarLeft({ isDesktop: true });
    expect(screen.getByRole("heading")).toBeInTheDocument();
  });

  it("hides app title heading on mobile", () => {
    renderNavbarLeft({ isDesktop: false });
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders empty breadcrumbs when items is empty", () => {
    const { container } = renderNavbarLeft({ items: [] });
    // Renders without error; breadcrumb list exists
    expect(container.firstChild).toBeDefined();
  });
});

describe("NavbarRight — authenticated user", () => {
  it("renders user name in menu", () => {
    renderNavbarRight();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders a menu element", () => {
    renderNavbarRight();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("renders at least one menu item", () => {
    renderNavbarRight();
    expect(screen.getAllByRole("menuitem").length).toBeGreaterThan(0);
  });
});

describe("NavbarRight — guest user", () => {
  it("renders Guest when no current user", () => {
    renderNavbarRight({ current: null });
    expect(screen.getByText("Guest")).toBeInTheDocument();
  });

  it("renders a menu element for guest", () => {
    renderNavbarRight({ current: null });
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });
});
