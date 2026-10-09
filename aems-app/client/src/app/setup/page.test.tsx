import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NotificationContext, NotificationType } from "../components/providers/notification";
import { RouteContext } from "../components/providers/routing";
import { CurrentContext } from "../components/providers/current";
import { staticRoutes } from "@/app/routes";

// Shared, test-controlled failure switch. Each mutation calls its onError when flipped.
const mutationState = { failWith: null as Error | null };

jest.mock("@apollo/client", () => ({
  useQuery: jest.fn(() => ({
    data: {
      readUnits: [
        {
          id: "unit-1",
          label: "Alpha",
          name: "alpha-1",
          campus: "Campus",
          building: "Building",
          system: "RTU",
          timezone: "UTC",
          stage: "Complete",
          location: null,
          configuration: {
            id: "cfg-1",
            label: "cfg",
            holidays: [],
            occupancies: [],
          },
        },
      ],
    },
    startPolling: jest.fn(),
    stopPolling: jest.fn(),
  })),
  useSubscription: jest.fn(() => ({ data: undefined })),
}));

jest.mock("../components/hooks/useMutationWithTracking", () => ({
  useMutationWithTracking: (_doc: unknown, opts: { onError?: (e: Error) => void }) => {
    const mutate = jest.fn().mockImplementation(() => {
      if (mutationState.failWith) {
        opts.onError?.(mutationState.failWith);
        return Promise.resolve({ data: undefined, errors: [{ message: mutationState.failWith.message }] });
      }
      return Promise.resolve({ data: {}, errors: undefined });
    });
    return [mutate, { loading: false, isOperationPending: false }];
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("./components/Setpoint", () => ({ Setpoint: () => null }));
jest.mock("./components/Schedules", () => ({ Schedules: () => null }));
jest.mock("./components/Holidays", () => ({ Holidays: () => null }));
jest.mock("./components/Occupancies", () => ({ Occupancies: () => null }));
jest.mock("./components/Unit", () => ({ Unit: () => null }));
jest.mock("./components/Location", () => ({ Location: () => null }));
jest.mock("../components/common", () => ({
  Search: () => null,
}));

const mockCurrentCtx = {
  current: {
    id: "u1",
    name: "Admin",
    email: "a@b.c",
    role: "admin user",
    image: null,
    emailVerified: null,
    preferences: null,
    createdAt: "",
    updatedAt: "",
  },
  loading: false,
  updateCurrent: jest.fn(),
  refetchCurrent: jest.fn(),
};

const mockRouteCtx = {
  routes: staticRoutes,
  route: undefined,
  items: [],
  resolvers: {},
  addResolver: jest.fn(),
  removeResolver: jest.fn(),
};

function renderPage(createNotification: jest.Mock) {
  const Page = require("./page").default;
  return render(
    <NotificationContext.Provider value={{ createNotification }}>
      <RouteContext.Provider value={mockRouteCtx as any}>
        <CurrentContext.Provider value={mockCurrentCtx as any}>
          <Page />
        </CurrentContext.Provider>
      </RouteContext.Provider>
    </NotificationContext.Provider>,
  );
}

async function enterEditModeAndSave(label: string, newLabel: string) {
  // Click the Edit button next to the unit.
  const editButton = screen.getAllByRole("button").find((b) => b.querySelector("[data-icon='edit']"));
  expect(editButton).toBeDefined();
  fireEvent.click(editButton!);

  // The unit should now be in edit mode. Change its label.
  const campusInput = screen.getAllByDisplayValue("Campus")[0];
  const row = campusInput.closest(".row") ?? campusInput.parentElement!.parentElement!.parentElement!;
  expect(row).toBeTruthy();

  // Change the system field to make editing non-trivial.
  const systemInput = screen.getByDisplayValue("RTU");
  fireEvent.change(systemInput, { target: { value: newLabel } });

  // Click the Save button (floppy-disk icon when idle).
  const saveButton = screen.getAllByRole("button").find((b) => b.querySelector("[data-icon='floppy-disk']"));
  expect(saveButton).toBeDefined();
  await act(async () => {
    fireEvent.click(saveButton!);
  });
}

// scenario: save-failure-reported
describe("Setup page save failure", () => {
  beforeEach(() => {
    mutationState.failWith = null;
  });

  it("shows the success notification and clears edits when every write succeeds", async () => {
    const createNotification = jest.fn();
    renderPage(createNotification);
    await enterEditModeAndSave("Alpha", "Alpha-2");

    await waitFor(() =>
      expect(createNotification).toHaveBeenCalledWith(
        "All changes saved successfully",
        NotificationType.Notification,
      ),
    );
    // Editing should have been cleared: the Edit icon returns.
    await waitFor(() =>
      expect(screen.getAllByRole("button").some((b) => b.querySelector("[data-icon='edit']"))).toBe(true),
    );
  }, 20000);

  it("names the failure, keeps the edits, and shows no success when a write fails", async () => {
    mutationState.failWith = new Error("backend refused the write");
    const createNotification = jest.fn();
    renderPage(createNotification);
    await enterEditModeAndSave("Alpha", "Alpha-2");

    // The failure is named: an Error notification carries the mutation error's message.
    await waitFor(() =>
      expect(createNotification).toHaveBeenCalledWith(
        "backend refused the write",
        NotificationType.Error,
      ),
    );

    // No success is shown.
    expect(createNotification).not.toHaveBeenCalledWith(
      "All changes saved successfully",
      NotificationType.Notification,
    );

    // Edits are kept: the Save button is still present (we are still in edit mode).
    expect(screen.getAllByRole("button").some((b) => b.querySelector("[data-icon='floppy-disk']"))).toBe(true);
  }, 20000);
});
