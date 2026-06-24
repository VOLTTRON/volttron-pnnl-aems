import { renderHook, act, waitFor } from "@testing-library/react";
import { useContext } from "react";
import { MockedProvider } from "@apollo/client/testing";
import { ReadCurrentDocument, UpdateCurrentDocument } from "@/graphql-codegen/graphql";
import { CurrentContext, CurrentProvider } from "./current";
import { NotificationContext, NotificationProvider, NotificationType } from "./notification";

const mockUser = {
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

const readCurrentSuccess = {
  request: { query: ReadCurrentDocument, variables: {} },
  result: { data: { readCurrent: mockUser } },
};

const readCurrentError = {
  request: { query: ReadCurrentDocument, variables: {} },
  error: new Error("auth error"),
};

const updateCurrentSuccess = {
  request: {
    query: UpdateCurrentDocument,
    variables: { update: { name: "Alice Updated" } },
  },
  result: { data: { updateCurrent: { ...mockUser, name: "Alice Updated" } } },
};

const updateCurrentError = {
  request: {
    query: UpdateCurrentDocument,
    variables: { update: { name: "Bad" } },
  },
  error: new Error("update failed"),
};

function makeWrapper(mocks: any[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        <NotificationProvider>
          <CurrentProvider>{children}</CurrentProvider>
        </NotificationProvider>
      </MockedProvider>
    );
  };
}

describe("CurrentProvider", () => {
  it("starts with current undefined and loading true", () => {
    const { result } = renderHook(() => useContext(CurrentContext), {
      wrapper: makeWrapper([readCurrentSuccess]),
    });
    expect(result.current.current).toBeUndefined();
    expect(result.current.loading).toBe(true);
  });

  it("populates current after query resolves", async () => {
    const { result } = renderHook(() => useContext(CurrentContext), {
      wrapper: makeWrapper([readCurrentSuccess]),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.current?.id).toBe("user-1");
    expect(result.current.current?.name).toBe("Alice");
  });

  it("sets current to null on query error", async () => {
    const { result } = renderHook(() => useContext(CurrentContext), {
      wrapper: makeWrapper([readCurrentError]),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.current).toBeNull();
  });

  it("creates error notification on query failure", async () => {
    function Combined() {
      const ctx = useContext(CurrentContext);
      const notif = useContext(NotificationContext);
      return { ctx, notif };
    }

    const { result } = renderHook(() => Combined(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[readCurrentError]} addTypename={false}>
          <NotificationProvider>
            <CurrentProvider>{children}</CurrentProvider>
          </NotificationProvider>
        </MockedProvider>
      ),
    });
    await waitFor(() => expect(result.current.notif.notifications?.length).toBeGreaterThan(0));
    expect(result.current.notif.notifications?.[0].type).toBe(NotificationType.Error);
    expect(result.current.notif.notifications?.[0].message).toMatch(/auth error/);
  });

  it("updateCurrent updates the current user on success", async () => {
    const { result } = renderHook(() => useContext(CurrentContext), {
      wrapper: makeWrapper([readCurrentSuccess, updateCurrentSuccess]),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateCurrent!({ name: "Alice Updated" } as any);
    });
    expect(result.current.current?.name).toBe("Alice Updated");
  });

  it("creates error notification on updateCurrent failure", async () => {
    function Combined() {
      const ctx = useContext(CurrentContext);
      const notif = useContext(NotificationContext);
      return { ctx, notif };
    }

    const { result } = renderHook(() => Combined(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[readCurrentSuccess, updateCurrentError]} addTypename={false}>
          <NotificationProvider>
            <CurrentProvider>{children}</CurrentProvider>
          </NotificationProvider>
        </MockedProvider>
      ),
    });
    await waitFor(() => expect(result.current.ctx.loading).toBe(false));

    await act(async () => {
      await result.current.ctx.updateCurrent!({ name: "Bad" } as any);
    });
    await waitFor(() => expect(result.current.notif.notifications?.length).toBeGreaterThan(0));
    expect(result.current.notif.notifications?.some((n) => n.type === NotificationType.Error)).toBe(true);
  });

  it("refetchCurrent re-fetches and updates current", async () => {
    const refetchMock = {
      request: { query: ReadCurrentDocument, variables: {} },
      result: { data: { readCurrent: { ...mockUser, name: "Refetched Alice" } } },
    };
    const { result } = renderHook(() => useContext(CurrentContext), {
      wrapper: makeWrapper([readCurrentSuccess, refetchMock]),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refetchCurrent!();
    });
    expect(result.current.current?.name).toBe("Refetched Alice");
  });
});
