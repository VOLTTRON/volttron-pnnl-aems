"use client";

import { NotificationContext, NotificationType } from "../providers";
import { useContext, useMemo } from "react";
import { isObject } from "lodash";
import { Intent, OverlayToaster, Position, Toast2 } from "@blueprintjs/core";

export function Notification() {
  const { notifications, clearNotification } = useContext(NotificationContext);

  const error = useMemo(
    () =>
      notifications
        ?.filter((v) => v.type === NotificationType.Error)
        .sort((a, b) => a.timestamp - b.timestamp)
        .find(isObject),
    [notifications]
  );

  const notification = useMemo(
    () =>
      notifications
        ?.filter((v) => v.type === NotificationType.Notification)
        .sort((a, b) => a.timestamp - b.timestamp)
        .find(isObject),
    [notifications]
  );

  return (
    <>
      <OverlayToaster position={Position.BOTTOM_LEFT}>
        {error && (
          <Toast2 message={error.message} intent={Intent.DANGER} onDismiss={() => clearNotification?.(error)} />
        )}
      </OverlayToaster>
      <OverlayToaster position={Position.BOTTOM_RIGHT}>
        {notification && (
          <Toast2
            message={notification.message}
            intent={Intent.WARNING}
            onDismiss={() => clearNotification?.(notification)}
          />
        )}
      </OverlayToaster>
    </>
  );
}
