import { renderHook, act } from "@testing-library/react";
import { useContext } from "react";
import {
  NotificationContext,
  NotificationProvider,
  NotificationType,
  NotificationModel,
} from "./notification";

describe("NotificationModel", () => {
  it("sets message and default type", () => {
    const n = new NotificationModel("hello");
    expect(n.message).toBe("hello");
    expect(n.type).toBe(NotificationType.Notification);
    expect(n.id).toMatch(/^Notification-\d+$/);
    expect(n.timestamp).toBeGreaterThan(0);
  });

  it("sets error type when specified", () => {
    const n = new NotificationModel("oops", NotificationType.Error);
    expect(n.type).toBe(NotificationType.Error);
  });
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>;
}

describe("NotificationProvider", () => {
  it("exposes empty notifications initially", () => {
    const { result } = renderHook(() => useContext(NotificationContext), { wrapper });
    expect(result.current.notifications).toEqual([]);
  });

  it("createNotification adds a notification", () => {
    const { result } = renderHook(() => useContext(NotificationContext), { wrapper });
    act(() => {
      result.current.createNotification!("test message");
    });
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications![0].message).toBe("test message");
    expect(result.current.notifications![0].type).toBe(NotificationType.Notification);
  });

  it("createNotification with Error type", () => {
    const { result } = renderHook(() => useContext(NotificationContext), { wrapper });
    act(() => {
      result.current.createNotification!("error msg", NotificationType.Error);
    });
    expect(result.current.notifications![0].type).toBe(NotificationType.Error);
  });

  it("deduplicates notifications with same message and explicit type", () => {
    const { result } = renderHook(() => useContext(NotificationContext), { wrapper });
    let first: ReturnType<NonNullable<typeof result.current.createNotification>>;
    act(() => {
      first = result.current.createNotification!("dup", NotificationType.Notification);
    });
    let second: ReturnType<NonNullable<typeof result.current.createNotification>>;
    act(() => {
      second = result.current.createNotification!("dup", NotificationType.Notification);
    });
    expect(result.current.notifications).toHaveLength(1);
    expect(first!.id).toBe(second!.id);
  });

  it("clearNotification removes the notification", () => {
    const { result } = renderHook(() => useContext(NotificationContext), { wrapper });
    let notification: ReturnType<NonNullable<typeof result.current.createNotification>>;
    act(() => {
      notification = result.current.createNotification!("to remove");
    });
    expect(result.current.notifications).toHaveLength(1);
    act(() => {
      result.current.clearNotification!(notification!);
    });
    expect(result.current.notifications).toHaveLength(0);
  });

  it("clearNotification with unknown notification is a no-op", () => {
    const { result } = renderHook(() => useContext(NotificationContext), { wrapper });
    act(() => {
      result.current.createNotification!("keep");
    });
    const stranger = new NotificationModel("stranger");
    act(() => {
      result.current.clearNotification!(stranger);
    });
    expect(result.current.notifications).toHaveLength(1);
  });
});
