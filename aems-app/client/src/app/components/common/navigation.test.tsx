import { render, screen } from "@testing-library/react";
import { useRouter, usePathname } from "next/navigation";
import { RouteContext } from "../providers/routing";
import { CurrentContext } from "../providers/current";
import { ScreenSizeContext } from "../providers/screen-size";
import { Navigation } from "./navigation";
import { staticRoutes } from "@/app/routes";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => "/"),
}));

const mockCurrent = {
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

const mockAdminUser = { ...mockCurrent, role: "admin" };

const desktopScreen = {
  isDesktop: true,
  isMobile: false,
  isTablet: false,
  screenWidth: 1280,
  screenHeight: 768,
  isPortrait: false,
  isLandscape: true,
  isTouchDevice: false,
};

function renderNavigation({ current = mockCurrent as any, isDesktop = true } = {}) {
  const routeCtx = {
    routes: staticRoutes,
    route: staticRoutes.root,
    items: [],
    resolvers: {},
    addResolver: jest.fn(),
    removeResolver: jest.fn(),
  };

  return render(
    <ScreenSizeContext.Provider value={{ ...desktopScreen, isDesktop, isMobile: !isDesktop }}>
      <CurrentContext.Provider value={{ current, loading: false, updateCurrent: jest.fn(), refetchCurrent: jest.fn() }}>
        <RouteContext.Provider value={routeCtx}>
          <Navigation />
        </RouteContext.Provider>
      </CurrentContext.Provider>
    </ScreenSizeContext.Provider>,
  );
}

describe("Navigation", () => {
  it("renders without crashing", () => {
    renderNavigation();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("renders at least one menu item", () => {
    renderNavigation();
    expect(screen.getAllByRole("menuitem").length).toBeGreaterThan(0);
  });

  it("renders publicly visible routes (About is display:true for all)", () => {
    renderNavigation();
    expect(screen.getByText("About")).toBeInTheDocument();
  });

  it("renders Demo route for user", () => {
    renderNavigation();
    expect(screen.getByText("Demo")).toBeInTheDocument();
  });

  it("renders Admin group for admin users (parent of admin routes)", () => {
    renderNavigation({ current: mockAdminUser as any });
    // "admin" group is display:'admin' with index:true — rendered as a submenu wrapper
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("hides Admin group from non-admin users", () => {
    renderNavigation({ current: mockCurrent });
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("renders menu items for authenticated user", () => {
    renderNavigation();
    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems.length).toBeGreaterThan(0);
  });

  it("does not render index routes (home) as menu items", () => {
    renderNavigation();
    // home is index:true so its children (about, demo) render instead of it
    // The word "Home" should not appear in the nav
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });
});
