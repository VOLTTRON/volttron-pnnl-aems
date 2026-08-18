import { render, screen } from "@testing-library/react";
import { NotificationContext } from "../components/providers/notification";
import { LoggingContext } from "../components/providers/logging";

jest.mock("@apollo/client", () => ({
  useQuery: jest.fn(() => ({ data: undefined, loading: false, refetch: jest.fn() })),
}));

jest.mock("ansi_up", () => ({
  AnsiUp: jest.fn().mockImplementation(() => ({
    ansi_to_html: (s: string) => s,
  })),
}));

jest.mock("html-react-parser", () => ({
  __esModule: true,
  default: (s: string) => s,
}));

function renderPage() {
  const Page = require("./page").default;
  return render(
    <LoggingContext.Provider value={{ logs: [] }}>
      <NotificationContext.Provider value={{ createNotification: jest.fn() }}>
        <Page />
      </NotificationContext.Provider>
    </LoggingContext.Provider>,
  );
}

describe("Logs page", () => {
  it("renders without crashing", () => {
    const { container } = renderPage();
    expect(container).toBeDefined();
  });

  it("renders Server Logs tab", () => {
    renderPage();
    expect(screen.getByText("Server Logs")).toBeInTheDocument();
  });

  it("renders Client Logs tab", () => {
    renderPage();
    expect(screen.getByText("Client Logs")).toBeInTheDocument();
  });
});
