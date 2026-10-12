import { render, screen, waitFor } from "@testing-library/react";

// Next's router is stable across renders; a fresh object per call would re-run every effect.
const router = { push: jest.fn() };
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => router),
}));

jest.mock("../[provider]/login/page", () => ({
  __esModule: true,
  default: () => <div data-testid="provider-login">provider-login</div>,
}));

import Page from "./page";

const SafePage = Page as React.ComponentType;

describe("Auth login page", () => {
  const loginUrl = process.env.NEXT_PUBLIC_AUTHJS_LOGIN_URL;

  beforeEach(() => {
    router.push.mockClear();
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ local: { name: "local" } }),
    }) as any;
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    if (loginUrl === undefined) delete process.env.NEXT_PUBLIC_AUTHJS_LOGIN_URL;
    else process.env.NEXT_PUBLIC_AUTHJS_LOGIN_URL = loginUrl;
    jest.restoreAllMocks();
  });

  it("redirects to the Auth.js login page without asking for the provider list", async () => {
    process.env.NEXT_PUBLIC_AUTHJS_LOGIN_URL = "/authjs/signin";
    render(<SafePage />);
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/authjs/signin"));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("lists the providers when no Auth.js login page is configured", async () => {
    delete process.env.NEXT_PUBLIC_AUTHJS_LOGIN_URL;
    render(<SafePage />);
    expect(await screen.findByTestId("provider-login")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });
});
