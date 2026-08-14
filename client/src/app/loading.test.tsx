import { render } from "@testing-library/react";

jest.mock("./components/common", () => ({
  GlobalLoading: () => <div data-testid="global-loading">Loading…</div>,
}));

import Loading from "./loading";

describe("Loading page", () => {
  it("renders without crashing", () => {
    const { container } = render(<Loading />);
    expect(container).toBeDefined();
  });

  it("renders the global loading indicator", () => {
    const { getByTestId } = render(<Loading />);
    expect(getByTestId("global-loading")).toBeInTheDocument();
  });
});
