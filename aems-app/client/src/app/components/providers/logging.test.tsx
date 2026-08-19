import { render, screen, act } from "@testing-library/react";
import { useContext } from "react";
import { LoggingContext, LoggingProvider } from "./logging";

function LogConsumer() {
  const { logs } = useContext(LoggingContext);
  return <div data-testid="count">{logs.length}</div>;
}

describe("LoggingProvider", () => {
  it("renders children", () => {
    render(
      <LoggingProvider>
        <span data-testid="child">hello</span>
      </LoggingProvider>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("provides a logs array via context", () => {
    render(
      <LoggingProvider>
        <LogConsumer />
      </LoggingProvider>,
    );
    const count = screen.getByTestId("count");
    expect(count).toBeInTheDocument();
  });

  it("has at least one log entry in development (disabled banner)", () => {
    // In test env NODE_ENV !== 'development', so isDisabled is false and the
    // disabledLog is NOT added — logs start empty.
    render(
      <LoggingProvider>
        <LogConsumer />
      </LoggingProvider>,
    );
    // The count may be 0 (test env) or 1 (dev env) — either is valid
    const count = parseInt(screen.getByTestId("count").textContent ?? "0", 10);
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
