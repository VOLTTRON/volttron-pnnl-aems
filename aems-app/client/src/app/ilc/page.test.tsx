import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NotificationContext, NotificationType } from "../components/providers/notification";
import { RouteContext } from "../components/providers/routing";
import { CurrentContext } from "../components/providers/current";
import { staticRoutes } from "@/app/routes";

const mutationState = { failWith: null as Error | null };

jest.mock("@apollo/client", () => ({
  useQuery: jest.fn(() => ({
    data: {
      readControls: [
        {
          id: "ctrl-1",
          label: "Ctrl",
          correlation: "0.5",
          stage: "Complete",
          units: [
            {
              id: "unit-1",
              label: "U1",
              name: "u1",
              campus: "C",
              building: "B",
              peakLoadExclude: false,
            },
          ],
        },
      ],
    },
    loading: false,
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

jest.mock("./components/Unit", () => ({ Unit: () => null }));

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

async function editAndSave(newLabel: string) {
  const editButton = screen.getAllByRole("button").find((b) => b.querySelector("[data-icon='edit']"));
  expect(editButton).toBeDefined();
  fireEvent.click(editButton!);

  const labelInput = screen.getByDisplayValue("Ctrl");
  fireEvent.change(labelInput, { target: { value: newLabel } });

  const saveButton = screen.getAllByRole("button").find((b) => b.querySelector("[data-icon='floppy-disk']"));
  expect(saveButton).toBeDefined();
  await act(async () => {
    fireEvent.click(saveButton!);
  });
}

// scenario: save-failure-reported
describe("ILC page save failure", () => {
  beforeEach(() => {
    mutationState.failWith = null;
  });

  it("shows the success notification and clears edits when every write succeeds", async () => {
    const createNotification = jest.fn();
    renderPage(createNotification);
    await editAndSave("Ctrl-2");

    await waitFor(() =>
      expect(createNotification).toHaveBeenCalledWith(
        "All changes saved successfully",
        NotificationType.Notification,
      ),
    );
    await waitFor(() =>
      expect(screen.getAllByRole("button").some((b) => b.querySelector("[data-icon='edit']"))).toBe(true),
    );
  }, 20000);

  it("names the failure, keeps the edits, and shows no success when a write fails", async () => {
    mutationState.failWith = new Error("control write refused");
    const createNotification = jest.fn();
    renderPage(createNotification);
    await editAndSave("Ctrl-2");

    await waitFor(() =>
      expect(createNotification).toHaveBeenCalledWith(
        "control write refused",
        NotificationType.Error,
      ),
    );
    expect(createNotification).not.toHaveBeenCalledWith(
      "All changes saved successfully",
      NotificationType.Notification,
    );
    expect(screen.getAllByRole("button").some((b) => b.querySelector("[data-icon='floppy-disk']"))).toBe(true);
  }, 20000);
});
