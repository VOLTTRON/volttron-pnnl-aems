import { render, screen, fireEvent } from "@testing-library/react";
import ErrorPage from "./error";

describe("Error boundary page", () => {
  const mockReset = jest.fn();
  const testError = new Error("Test error message");

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = render(<ErrorPage error={testError} reset={mockReset} />);
    expect(container).toBeDefined();
  });

  it("renders the error callout title", () => {
    render(<ErrorPage error={testError} reset={mockReset} />);
    expect(screen.getByText("Something went wrong!")).toBeInTheDocument();
  });

  it("renders the Try again button", () => {
    render(<ErrorPage error={testError} reset={mockReset} />);
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("calls reset when Try again is clicked", () => {
    render(<ErrorPage error={testError} reset={mockReset} />);
    fireEvent.click(screen.getByText("Try again"));
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("displays the error message", () => {
    render(<ErrorPage error={testError} reset={mockReset} />);
    expect(screen.getByText(/Test error message/)).toBeInTheDocument();
  });
});
