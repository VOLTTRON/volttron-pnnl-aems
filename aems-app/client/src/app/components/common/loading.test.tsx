import { render, screen } from "@testing-library/react";
import { LoadingContext, LoadingType, LoadingModel } from "../providers/loading";
import { LocalLoading, GlobalLoading } from "./loading";

describe("LocalLoading", () => {
  it("renders a spinner", () => {
    render(<LocalLoading />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});

describe("GlobalLoading", () => {
  it("renders nothing when no loadings in context", () => {
    const { container } = render(
      <LoadingContext.Provider value={{ loadings: [] }}>
        <GlobalLoading />
      </LoadingContext.Provider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when only LOCAL loadings exist", () => {
    const loading = new LoadingModel(LoadingType.LOCAL);
    const { container } = render(
      <LoadingContext.Provider value={{ loadings: [loading] }}>
        <GlobalLoading />
      </LoadingContext.Provider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a spinner when a GLOBAL loading exists", () => {
    const loading = new LoadingModel(LoadingType.GLOBAL);
    render(
      <LoadingContext.Provider value={{ loadings: [loading] }}>
        <GlobalLoading />
      </LoadingContext.Provider>
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
