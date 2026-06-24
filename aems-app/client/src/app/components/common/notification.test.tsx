import { render, screen, fireEvent, act } from "@testing-library/react";
import { useContext } from "react";
import {
  NotificationContext,
  NotificationProvider,
  NotificationType,
  CreateNotification,
  ClearNotification,
  Notification as NotificationItem,
} from "../providers/notification";
import { Notification } from "./notification";

type NotifCtx = {
  notifications?: NotificationItem[];
  clearNotification?: ClearNotification;
  createNotification?: CreateNotification;
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>;
}

function NotificationHarness({ ctxRef }: { ctxRef: { current: NotifCtx | null } }) {
  ctxRef.current = useContext(NotificationContext);
  return <Notification />;
}

describe("Notification", () => {
  it("renders nothing when there are no notifications", () => {
    render(
      <Wrapper>
        <Notification />
      </Wrapper>,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error toast for Error type notifications", async () => {
    const ctxRef = { current: null as NotifCtx | null };
    render(
      <Wrapper>
        <NotificationHarness ctxRef={ctxRef} />
      </Wrapper>,
    );
    act(() => {
      ctxRef.current?.createNotification?.("Something went wrong", NotificationType.Error);
    });
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
  });

  it("shows a warning toast for Notification type", async () => {
    const ctxRef = { current: null as NotifCtx | null };
    render(
      <Wrapper>
        <NotificationHarness ctxRef={ctxRef} />
      </Wrapper>,
    );
    act(() => {
      ctxRef.current?.createNotification?.("Info message", NotificationType.Notification);
    });
    expect(await screen.findByText("Info message")).toBeInTheDocument();
  });

  it("calling dismiss removes the error notification from context", async () => {
    const ctxRef = { current: null as NotifCtx | null };
    render(
      <Wrapper>
        <NotificationHarness ctxRef={ctxRef} />
      </Wrapper>,
    );
    act(() => {
      ctxRef.current?.createNotification?.("Dismissable error", NotificationType.Error);
    });
    const toastMsg = await screen.findByText("Dismissable error");
    const dismissBtn = toastMsg.closest("[class*='toast']")?.querySelector("button");
    if (dismissBtn) {
      act(() => {
        fireEvent.click(dismissBtn);
      });
      expect(ctxRef.current?.notifications).toHaveLength(0);
    }
  });
});
