"use client";

import { difference, union } from "lodash";
import { createContext, useCallback, useState } from "react";

export type CreateNotification = (message: string, type?: NotificationType) => Notification;

export type ClearNotification = (value: Notification) => void;

export enum NotificationType {
  Notification,
  Error,
}

export interface Notification {
  readonly id: string;
  readonly timestamp: number;
  readonly type: NotificationType;
  readonly message: string;
}

export class NotificationModel implements Notification {
  private static number = 0;
  readonly id: string;
  readonly timestamp: number;
  readonly type: NotificationType;
  readonly message: string;

  constructor(message: string, type = NotificationType.Notification) {
    this.id = `Notification-${++NotificationModel.number}`;
    this.timestamp = new Date().getTime();
    this.message = message;
    this.type = type;
  }
}

export const NotificationContext = createContext<{
  notifications?: Notification[];
  clearNotification?: ClearNotification;
  createNotification?: CreateNotification;
}>({});

function notificationBuilder(m: string, t?: NotificationType): Notification {
  return new NotificationModel(m, t);
}

/**
 * Provider for notifications.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState([] as Notification[]);

  const clearNotification: ClearNotification = useCallback(
    (v) => {
      if (notifications.includes(v)) {
        setNotifications(difference(notifications, [v]));
      }
    },
    [notifications]
  );

  const createNotification: CreateNotification = useCallback(
    (m, t) => {
      let notification: Notification | undefined = notifications.find((v) => v.message === m && v.type === t);
      if (notification) {
        return notification;
      }
      notification = notificationBuilder(m, t);
      setNotifications(union(notifications, [notification]));
      return notification;
    },
    [notifications]
  );

  return (
    <NotificationContext.Provider value={{ notifications, clearNotification, createNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}
