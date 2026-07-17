import { renderHook, act } from "@testing-library/react";
import { useContext } from "react";
import {
  isDisplay,
  isGranted,
  findRedirect,
  findRoute,
  findPath,
  RouteContext,
  RouteProvider,
} from "./routing";
import { staticRoutes } from "@/app/routes";
import { Dynamic } from "@/app/types";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
}));

import { usePathname } from "next/navigation";
const mockPathname = usePathname as jest.Mock;

// Minimal route node stubs
const makeNode = (data: object, children: any[] = []) => ({
  data,
  children,
  getAncestors: () => [{ data }],
  isAncestor: () => false,
});

describe("isDisplay", () => {
  it("returns false when display is falsy", () => {
    const node = makeNode({ display: false });
    expect(isDisplay(node as any)).toBe(false);
  });

  it("returns false when display is undefined", () => {
    const node = makeNode({});
    expect(isDisplay(node as any)).toBe(false);
  });

  it("returns true when display is boolean true", () => {
    const node = makeNode({ display: true });
    expect(isDisplay(node as any)).toBe(true);
  });

  it("returns true when display matches user role", () => {
    const node = makeNode({ display: "admin" });
    expect(isDisplay(node as any, { role: "admin" })).toBe(true);
  });

  it("returns false when display role does not match user role", () => {
    const node = makeNode({ display: "admin" });
    expect(isDisplay(node as any, { role: "user" })).toBe(false);
  });

  it("returns false when user has no role", () => {
    const node = makeNode({ display: "admin" });
    expect(isDisplay(node as any, {})).toBe(false);
  });
});

describe("isGranted", () => {
  it("returns true when scope is undefined", () => {
    const node = makeNode({});
    expect(isGranted(node as any)).toBe(true);
  });

  it("returns true when user role matches scope", () => {
    const node = makeNode({ scope: "user" });
    expect(isGranted(node as any, { role: "user" })).toBe(true);
  });

  it("returns true when user has admin role and scope is user", () => {
    const node = makeNode({ scope: "user" });
    expect(isGranted(node as any, { role: "admin" })).toBe(true);
  });

  it("returns false when user role does not match scope", () => {
    const node = makeNode({ scope: "admin" });
    expect(isGranted(node as any, { role: "user" })).toBe(false);
  });

  it("returns false when user has no role", () => {
    const node = makeNode({ scope: "admin" });
    expect(isGranted(node as any, {})).toBe(false);
  });
});

describe("findRedirect", () => {
  it("returns a non-index, displayable route for any authenticated user", () => {
    // 'welcome' has display: true and no scope — granted for any role including empty
    const result = findRedirect(staticRoutes, { role: "user" });
    expect(result?.data?.id).toBe("welcome");
  });

  it("returns the same non-index, displayable route for admin", () => {
    const result = findRedirect(staticRoutes, { role: "admin" });
    expect(result?.data?.id).toBe("welcome");
  });

  it("falls back to login when routes tree has no displayable non-index routes", () => {
    // Build a minimal routes tree that has no display:true non-index routes
    const { buildTree, deepFreeze } = require("@local/common");
    const minimalRoutes = buildTree(
      deepFreeze([
        { id: "home", parentId: undefined, path: "/", index: true, name: "Home" },
        { id: "login", parentId: "home", path: "login", name: "Login", scope: "admin" },
      ]),
    );
    const result = findRedirect(minimalRoutes, { role: "" });
    // No displayable granted non-index routes; falls back to findNode("login")
    expect(result?.data?.id).toBe("login");
  });
});

describe("findRoute", () => {
  it("resolves root path", () => {
    const route = findRoute(staticRoutes, "/");
    expect(route.data?.id).toBe("home");
  });

  it("resolves a top-level static path", () => {
    const route = findRoute(staticRoutes, "/welcome");
    expect(route.data?.id).toBe("welcome");
  });

  it("resolves a nested static path", () => {
    const route = findRoute(staticRoutes, "/demo");
    expect(route.data?.id).toBe("demo");
  });

  it("resolves a dynamic segment under demo", () => {
    const route = findRoute(staticRoutes, "/demo/some-book-id");
    expect(route.data?.id).toBe("book");
  });

  it("resolves items overload with ancestor array", () => {
    const { route, items } = findRoute(staticRoutes, "/welcome", true);
    expect(route.data?.id).toBe("welcome");
    expect(Array.isArray(items)).toBe(true);
  });
});

describe("findPath", () => {
  it("returns path string from route node ancestors", () => {
    const route = findRoute(staticRoutes, "/welcome");
    expect(findPath(route as any)).toContain("welcome");
  });

  it("builds path from Route array", () => {
    const items = [{ path: "demo" }, { path: Dynamic }] as any[];
    const result = findPath(items);
    expect(result).toContain("demo");
    expect(result).toContain("[id]");
  });

  it("replaces Dynamic symbol with [id]", () => {
    const items = [{ path: Dynamic }] as any[];
    expect(findPath(items)).toBe("[id]");
  });
});

describe("RouteProvider", () => {
  function wrapper({ children }: { children: React.ReactNode }) {
    return <RouteProvider>{children}</RouteProvider>;
  }

  beforeEach(() => {
    mockPathname.mockReturnValue("/");
  });

  it("provides routes and empty items at root path", () => {
    const { result } = renderHook(() => useContext(RouteContext), { wrapper });
    expect(result.current.routes).toBe(staticRoutes);
    expect(result.current.items).toBeDefined();
  });

  it("exposes route matching mocked pathname", () => {
    mockPathname.mockReturnValue("/welcome");
    const { result } = renderHook(() => useContext(RouteContext), { wrapper });
    expect(result.current.route?.data?.id).toBe("welcome");
  });

  it("addResolver registers a resolver", () => {
    const { result } = renderHook(() => useContext(RouteContext), { wrapper });
    const resolver = jest.fn(async () => "resolved");
    act(() => {
      result.current.addResolver!("book", resolver);
    });
    expect(result.current.resolvers["book"]).toBe(resolver);
  });

  it("removeResolver unregisters a resolver", () => {
    const { result } = renderHook(() => useContext(RouteContext), { wrapper });
    const resolver = jest.fn(async () => "resolved");
    act(() => {
      result.current.addResolver!("book", resolver);
    });
    act(() => {
      result.current.removeResolver!("book");
    });
    expect(result.current.resolvers["book"]).toBeUndefined();
  });
});
