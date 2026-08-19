import { render, screen } from "@testing-library/react";

describe("Auth denied page", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  });

  it("renders the Access Denied heading (no admin email set)", async () => {
    delete process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const { default: Page } = await import("./page");
    const result = await (Page as () => Promise<React.ReactElement>)();
    render(result);
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
  });

  it("renders the default message when no admin email is configured", async () => {
    delete process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const { default: Page } = await import("./page");
    const result = await (Page as () => Promise<React.ReactElement>)();
    render(result);
    expect(screen.getByText(/You must be granted access/)).toBeInTheDocument();
  });
});
