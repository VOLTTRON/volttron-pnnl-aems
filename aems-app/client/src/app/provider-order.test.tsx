jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
}));

jest.mock("./components/common", () => ({
  Banner: () => null,
  GlobalLoading: () => null,
  LocalLoading: () => null,
  Notice: () => null,
  Notification: () => null,
  Theme: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="prov-theme">{children}</div>
  ),
}));

jest.mock("./components/providers", () => ({
  ConfigProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="prov-config">{children}</div>
  ),
  CurrentProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="prov-current">{children}</div>
  ),
  GraphqlProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="prov-graphql">{children}</div>
  ),
  RouteProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="prov-route">{children}</div>
  ),
  LoggingProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="prov-logging">{children}</div>
  ),
  LoadingProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="prov-loading">{children}</div>
  ),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="prov-notification">{children}</div>
  ),
  PreferencesProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="prov-preferences">{children}</div>
  ),
  ScreenSizeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="prov-screen-size">{children}</div>
  ),
}));

jest.mock("@blueprintjs/core", () => ({
  BlueprintProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="prov-blueprint">{children}</div>
  ),
}));

import { render, screen } from "@testing-library/react";
import RootLayout from "./layout";

// scenario: provider-order
describe("Provider nesting", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation((msg: unknown) => {
      if (typeof msg === "string" && msg.includes("validateDOMNesting")) return;
    });
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it("nests Logging outermost, Current near-innermost, Theme innermost", () => {
    render(
      <RootLayout>
        <div data-testid="children" />
      </RootLayout>,
    );

    const logging = screen.getByTestId("prov-logging");
    const current = screen.getByTestId("prov-current");
    const theme = screen.getByTestId("prov-theme");
    const children = screen.getByTestId("children");

    expect(logging.contains(current)).toBe(true);
    expect(current.contains(theme)).toBe(true);
    expect(theme.contains(children)).toBe(true);
  });

  it("places every other provider strictly between Logging and Theme", () => {
    render(
      <RootLayout>
        <div data-testid="children" />
      </RootLayout>,
    );

    const logging = screen.getByTestId("prov-logging");
    const theme = screen.getByTestId("prov-theme");
    for (const id of [
      "prov-blueprint",
      "prov-graphql",
      "prov-route",
      "prov-notification",
      "prov-loading",
      "prov-preferences",
      "prov-screen-size",
      "prov-config",
      "prov-current",
    ]) {
      const el = screen.getByTestId(id);
      expect(logging.contains(el)).toBe(true);
      expect(el.contains(theme)).toBe(true);
    }
  });
});
