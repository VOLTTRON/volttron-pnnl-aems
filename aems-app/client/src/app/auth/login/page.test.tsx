import { render } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("../[provider]/login/page", () => ({
  __esModule: true,
  default: () => <div data-testid="provider-login">provider-login</div>,
}));

import Page from "./page";

describe("Auth login page", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ local: { name: "local" } }),
    }) as any;
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders without crashing", () => {
    const SafePage = Page as React.ComponentType;
    const { container } = render(<SafePage />);
    expect(container).toBeDefined();
  });
});
