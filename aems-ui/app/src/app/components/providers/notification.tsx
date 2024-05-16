"use client";

import { difference, union } from "lodash";
import { createContext, useState } from "react";

export type CreateNotification = (
  message: string,
  type?: NotificationType
) => Notification;

export type ClearNotification = (value: Notification) => void;

export enum NotificationType {
  NOTIFICATION,
  ERROR,
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

  constructor(message: string, type = NotificationType.NOTIFICATION) {
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
export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState([] as Notification[]);

  const clearNotification: ClearNotification = (v) =>
    setNotifications(difference(notifications, [v]));
  const createNotification: CreateNotification = (m, t) => {
    const notification = notificationBuilder(m, t);
    setNotifications(union(notifications, [notification]));
    return notification;
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, clearNotification, createNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
