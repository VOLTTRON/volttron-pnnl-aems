import { staticRoutes } from "./routes";

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

  it("contains a 'demo' route scoped to user", () => {
    const demo = staticRoutes.findNode("demo");
    expect(demo?.data?.scope).toBe("user");
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
