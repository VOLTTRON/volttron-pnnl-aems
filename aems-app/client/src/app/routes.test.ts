import { staticRoutes } from "./routes";
import { findRoute, isGranted } from "./components/providers/routing";

// scenario: hidden-routes-reachable
describe("NEXT_PUBLIC_HIDDEN_ROUTES", () => {
  const originalHidden = process.env.NEXT_PUBLIC_HIDDEN_ROUTES;

  afterEach(() => {
    if (originalHidden === undefined) delete process.env.NEXT_PUBLIC_HIDDEN_ROUTES;
    else process.env.NEXT_PUBLIC_HIDDEN_ROUTES = originalHidden;
    jest.resetModules();
  });

  function loadRoutes() {
    let mod: typeof import("./routes") | undefined;
    jest.isolateModules(() => {
      mod = require("./routes");
    });
    return mod!;
  }

  it("sets display:false for ids listed in NEXT_PUBLIC_HIDDEN_ROUTES, hiding from nav", () => {
    process.env.NEXT_PUBLIC_HIDDEN_ROUTES = "welcome,info";
    const { staticRoutes } = loadRoutes();
    expect(staticRoutes.findNode("welcome")?.data?.display).toBe(false);
    expect(staticRoutes.findNode("info")?.data?.display).toBe(false);
  });

  it("accepts commas, pipes, colons, semicolons and spaces as separators", () => {
    process.env.NEXT_PUBLIC_HIDDEN_ROUTES = "welcome|info:dashboards;setup backups";
    const { staticRoutes } = loadRoutes();
    for (const id of ["welcome", "info", "dashboards", "setup", "backups"]) {
      expect(staticRoutes.findNode(id)?.data?.display).toBe(false);
    }
  });

  it("leaves routes not listed with their original display value", () => {
    process.env.NEXT_PUBLIC_HIDDEN_ROUTES = "welcome";
    const { staticRoutes } = loadRoutes();
    // 'info' was display:true by default and is NOT hidden
    expect(staticRoutes.findNode("info")?.data?.display).toBe(true);
    // 'admin' was display:"admin" by default and is NOT hidden
    expect(staticRoutes.findNode("admin")?.data?.display).toBe("admin");
  });

  it("keeps hidden routes reachable via findRoute: the node is still in the tree", () => {
    process.env.NEXT_PUBLIC_HIDDEN_ROUTES = "welcome,info";
    const { staticRoutes } = loadRoutes();
    const { findRoute } = require("./components/providers/routing");
    expect(findRoute(staticRoutes, "/welcome").data?.id).toBe("welcome");
    expect(findRoute(staticRoutes, "/info").data?.id).toBe("info");
  });

  it("empty NEXT_PUBLIC_HIDDEN_ROUTES hides nothing", () => {
    process.env.NEXT_PUBLIC_HIDDEN_ROUTES = "";
    const { staticRoutes } = loadRoutes();
    expect(staticRoutes.findNode("welcome")?.data?.display).toBe(true);
    expect(staticRoutes.findNode("info")?.data?.display).toBe(true);
  });
});

describe("staticRoutes", () => {
  it("is a tree with a root node", () => {
    expect(staticRoutes).toBeDefined();
    expect(staticRoutes.root).toBeDefined();
  });

  it("contains a 'home' route at the root", () => {
    const home = staticRoutes.findNode("home");
    expect(home?.data?.id).toBe("home");
    expect(home?.data?.index).toBe(true);
  });

  it("contains a 'welcome' route as a child of home", () => {
    const welcome = staticRoutes.findNode("welcome");
    expect(welcome?.data?.id).toBe("welcome");
    expect(welcome?.data?.display).toBe(true);
  });

  it("contains a 'demo' route scoped to admin", () => {
    const demo = staticRoutes.findNode("demo");
    expect(demo?.data?.scope).toBe("admin");
    expect(demo?.data?.display).toBe(false);
  });

  it("contains an 'admin' group route scoped to admin", () => {
    const admin = staticRoutes.findNode("admin");
    expect(admin?.data?.scope).toBe("admin");
    expect(admin?.data?.display).toBe("admin");
  });

  it("contains expected admin sub-routes", () => {
    const adminIds = ["feedback", "users", "banners", "logs", "backups", "keycloak"];
    for (const id of adminIds) {
      expect(staticRoutes.findNode(id)?.data?.id).toBe(id);
    }
  });

  it("contains auth routes (login, logout, denied)", () => {
    expect(staticRoutes.findNode("login")?.data?.id).toBe("login");
    expect(staticRoutes.findNode("logout")?.data?.id).toBe("logout");
    expect(staticRoutes.findNode("denied")?.data?.id).toBe("denied");
  });

  it("'keycloak' route is scoped to keycloak role", () => {
    const keycloak = staticRoutes.findNode("keycloak");
    expect(keycloak?.data?.scope).toBe("keycloak");
    expect(keycloak?.data?.display).toBe("keycloak");
  });

  it("dynamic 'book' route has dynamic flag", () => {
    const book = staticRoutes.findNode("book");
    expect(book?.data?.dynamic).toBe(true);
  });

  it("all nodes are iterable", () => {
    const ids = [...staticRoutes].map((n) => n.data?.id).filter(Boolean);
    expect(ids.length).toBeGreaterThan(5);
    expect(ids).toContain("home");
    expect(ids).toContain("welcome");
    expect(ids).toContain("users");
  });
});

// scenario: dev-demo-admin-only
describe("/dev and /demo admit only admins", () => {
  it("every demo-tree node is scoped to admin", () => {
    for (const id of ["demo", "book", "chapter"]) {
      expect(staticRoutes.findNode(id)?.data?.scope).toBe("admin");
    }
  });

  it("every dev-tree node is scoped to admin", () => {
    for (const id of ["dev", "dev-templates"]) {
      expect(staticRoutes.findNode(id)?.data?.scope).toBe("admin");
    }
  });

  it("findRoute resolves /dev and /dev/templates to admin-scoped nodes", () => {
    expect(findRoute(staticRoutes, "/dev").data?.id).toBe("dev");
    expect(findRoute(staticRoutes, "/dev/templates").data?.id).toBe("dev-templates");
  });

  it("a user role is refused /demo, /demo/[isbn], /demo/[isbn]/[ch], /dev and /dev/templates", () => {
    for (const path of ["/demo", "/demo/isbn-1", "/demo/isbn-1/ch-1", "/dev", "/dev/templates"]) {
      const route = findRoute(staticRoutes, path);
      expect(isGranted(route, { role: "user" })).toBe(false);
    }
  });

  it("an anonymous caller is refused /demo, /dev and /dev/templates", () => {
    for (const path of ["/demo", "/dev", "/dev/templates"]) {
      const route = findRoute(staticRoutes, path);
      expect(isGranted(route, {})).toBe(false);
    }
  });

  it("an admin is admitted to /demo, /demo/[isbn], /dev and /dev/templates", () => {
    for (const path of ["/demo", "/demo/isbn-1", "/dev", "/dev/templates"]) {
      const route = findRoute(staticRoutes, path);
      expect(isGranted(route, { role: "admin" })).toBe(true);
    }
  });
});
