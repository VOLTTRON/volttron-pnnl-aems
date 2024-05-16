"use client";

import { NotificationContext, NotificationType } from "../providers/notification";
import { useContext, useMemo, useState } from "react";
import { isObject, union } from "lodash";
import { useQuery } from "@apollo/client";
import { LogType, OrderBy, ReadLogsDocument } from "@/generated/queries/graphql";

export default function Footer() {
  const [cleared, setCleared] = useState([] as string[]);

  const { notifications, clearNotification } = useContext(NotificationContext);

  const { data } = useQuery(ReadLogsDocument, {
    variables: {
      orderBy: [{ createdAt: OrderBy.Desc }],
      where: { type: { equals: LogType.Banner } },
    },
    pollInterval: 10000,
  });
  const logs = data?.readLogs;

  const banner = useMemo(() => logs?.filter((v) => !cleared.includes(v.id)).find((v) => v), [logs, cleared]);

  const error = useMemo(
    () =>
      notifications
        ?.filter((v) => v.type === NotificationType.ERROR)
        .sort((a, b) => a.timestamp - b.timestamp)
        .find(isObject),
    [notifications]
  );

  const notification = useMemo(
    () =>
      notifications
        ?.filter((v) => v.type === NotificationType.NOTIFICATION)
        .sort((a, b) => a.timestamp - b.timestamp)
        .find(isObject),
    [notifications]
  );

  return (
    <div>
      {banner && (
        <div className="bg-blue-500 text-white p-2 text-center">
          <span>{banner.message}</span>
          <button
            className="ml-2 bg-blue-700 text-white px-2 py-1 rounded"
            onClick={() => setCleared(union(cleared, [banner.id]))}
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-500 text-white p-2 text-center">
          <span>{error.message}</span>
          <button className="ml-2 bg-red-700 text-white px-2 py-1 rounded" onClick={() => clearNotification?.(error)}>
            Dismiss
          </button>
        </div>
      )}

      {notification && (
        <div className="bg-green-500 text-white p-2 text-center">
          <span>{notification.message}</span>
          <button
            className="ml-2 bg-green-700 text-white px-2 py-1 rounded"
            onClick={() => clearNotification?.(notification)}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
