import { render, screen } from "@testing-library/react";
import { NotificationContext } from "../components/providers/notification";

jest.mock("@apollo/client", () => ({
  useQuery: jest.fn(() => ({ data: undefined, loading: false, refetch: jest.fn() })),
  useMutation: jest.fn(() => [jest.fn(), { loading: false }]),
}));

function renderPage() {
  const Page = require("./page").default;
  return render(
    <NotificationContext.Provider value={{ createNotification: jest.fn() }}>
      <Page />
    </NotificationContext.Provider>,
  );
}

describe("Keycloak page", () => {
  it("renders without crashing", () => {
    const { container } = renderPage();
    expect(container).toBeDefined();
  });

  it("renders the Keycloak Administration heading", () => {
    renderPage();
    expect(screen.getByText("Keycloak Administration")).toBeInTheDocument();
  });

  it("renders the Open Keycloak Admin Console button", () => {
    renderPage();
    expect(screen.getByText("Open Keycloak Admin Console")).toBeInTheDocument();
  });

  it("renders the User Role Management section", () => {
    renderPage();
    expect(screen.getByText("User Role Management")).toBeInTheDocument();
  });
});
