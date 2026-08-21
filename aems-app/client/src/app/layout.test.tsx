// Regression: the inner <Suspense> in RootLayout had no fallback prop, so it
// rendered null when a page component suspended during client-side navigation.
// Hard refresh was unaffected because SSR delivers complete HTML before hydration.

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
}));

jest.mock("./components/common", () => ({
  Banner: () => null,
  GlobalLoading: () => null,
  LocalLoading: () => <div data-testid="local-loading" />,
  Notice: () => null,
  Notification: () => null,
  Theme: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("./components/providers", () => ({
  ConfigProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  CurrentProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  GraphqlProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  RouteProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  LoggingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  LoadingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PreferencesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ScreenSizeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@blueprintjs/core", () => ({
  BlueprintProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { render, screen } from "@testing-library/react";
import RootLayout from "./layout";

const neverResolves = new Promise<never>(() => {});
function SuspendingPage(): never {
  throw neverResolves;
}

describe("RootLayout", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation((msg: unknown) => {
      if (typeof msg === "string" && msg.includes("validateDOMNesting")) return;
    });
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it("renders LocalLoading fallback when page content suspends", () => {
    render(<RootLayout><SuspendingPage /></RootLayout>);
    expect(screen.getByTestId("local-loading")).toBeInTheDocument();
  });
});
