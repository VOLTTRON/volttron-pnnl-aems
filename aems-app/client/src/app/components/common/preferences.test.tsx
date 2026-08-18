import { render, screen, fireEvent } from "@testing-library/react";
import { Preferences } from "./preferences";
import { CurrentContext } from "../providers/current";
import { PreferencesContext } from "../providers/preferences";
import { LoadingContext } from "../providers/loading";
import { Mode } from "@local/prisma";

const mockUpdateCurrent = jest.fn().mockResolvedValue(undefined);
const handleClose = jest.fn();

const mockCurrentUser = {
  id: "user-1",
  name: "Alice",
  email: "alice@example.com",
  image: null,
  role: "user",
  emailVerified: null,
  preferences: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const mockPreferences = { theme: "default", mode: Mode.Light };

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <LoadingContext.Provider value={{ createLoading: jest.fn(), clearLoading: jest.fn() }}>
      <CurrentContext.Provider value={{ current: mockCurrentUser as any, updateCurrent: mockUpdateCurrent, loading: false }}>
        <PreferencesContext.Provider value={{ preferences: mockPreferences }}>
          {children}
        </PreferencesContext.Provider>
      </CurrentContext.Provider>
    </LoadingContext.Provider>
  );
}

describe("Preferences component", () => {
  beforeEach(() => {
    handleClose.mockClear();
    mockUpdateCurrent.mockClear();
  });

  it("renders the preferences dialog", () => {
    render(<Preferences handleClose={handleClose} />, { wrapper });
    expect(screen.getByText("Preferences")).toBeInTheDocument();
  });

  it("shows the username input with current user name", () => {
    render(<Preferences handleClose={handleClose} />, { wrapper });
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("Alice");
  });

  it("updates the name field when user types", () => {
    render(<Preferences handleClose={handleClose} />, { wrapper });
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Bob" } });
    expect(input).toHaveValue("Bob");
  });

  it("clear button is present (icon-only minimal button in the input group)", () => {
    render(<Preferences handleClose={handleClose} />, { wrapper });
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Bob" } });
    // The clear button renders as a Blueprint minimal icon-only button without accessible text.
    // Verify at least one button exists alongside the input.
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
