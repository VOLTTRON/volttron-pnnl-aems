import { render, screen } from "@testing-library/react";
import { NotificationContext } from "../components/providers/notification";

jest.mock("@apollo/client", () => ({
  useQuery: jest.fn(() => ({ data: undefined, loading: false, refetch: jest.fn() })),
}));

jest.mock("./dialog", () => ({
  ViewFeedback: () => null,
}));

function renderPage() {
  const Page = require("./page").default;
  return render(
    <NotificationContext.Provider value={{ createNotification: jest.fn() }}>
      <Page />
    </NotificationContext.Provider>,
  );
}

describe("Feedback page", () => {
  it("renders without crashing", () => {
    const { container } = renderPage();
    expect(container).toBeDefined();
  });

  it("renders the refresh button", () => {
    renderPage();
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("renders the table", () => {
    renderPage();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
