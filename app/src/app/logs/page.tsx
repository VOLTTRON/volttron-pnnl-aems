"use client";

import styles from "./page.module.scss";
import { Button, ControlGroup, Tab, TabId, Tabs, TabsExpander } from "@blueprintjs/core";
import { useContext, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { ReadLogsQuery, LogType as LogTypeGql, StringFilterMode, ReadLogsDocument } from "@/generated/graphql-codegen/graphql";
import { Log, LoggingContext, NotificationContext, NotificationType } from "../components/providers";
import { Term, filter } from "@/utils/client";
import { LogType } from "@/common";
import { Paging, Search, Table } from "../components/common";
import { IconNames } from "@blueprintjs/icons";
import { sortBy } from "lodash";

export default function Page() {
  const [tab, setTab] = useState<TabId>("server-logs");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    field: keyof Term<NonNullable<ReadLogsQuery["readLogs"]>[0]>;
    direction: "Asc" | "Desc";
  }>({
    field: "createdAt",
    direction: "Desc",
  });
  const [paging, setPaging] = useState({ take: 10, skip: 0 });
  const [clientSort, setClientSort] = useState<{
    field: keyof Term<Log>;
    direction: "Asc" | "Desc";
  }>({
    field: "timestamp",
    direction: "Desc",
  });
  const [clientPaging, setClientPaging] = useState({ take: 10, skip: 0 });

  const { logs: clientData } = useContext(LoggingContext);
  const { createNotification } = useContext(NotificationContext);

  const { data, loading, refetch } = useQuery(ReadLogsDocument, {
    variables: {
      orderBy: { [sort.field]: sort.direction },
      where: LogType.parse(search)
        ? {
            OR: [
              { type: { equals: LogType.parseStrict(search).enum as LogTypeGql } },
              { message: { contains: search, mode: StringFilterMode.Insensitive } },
            ],
          }
        : { message: { contains: search, mode: StringFilterMode.Insensitive } },
      paging: paging,
    },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const logs = useMemo(
    () => filter(data?.readLogs ?? [], search, LogType.parse(search) ? ["type", "message"] : ["message"]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.readLogs]
  );

  const clientLogs = useMemo(() => {
    let temp = filter(clientData, search, ["type", "message"]);
    if (clientSort.field === "timestamp") {
      temp = sortBy(temp, (log) => log.timestamp);
    } else {
      temp = sortBy(temp, (log) => log.message);
    }
    if (clientSort.direction === "Desc") {
      temp.reverse();
    }
    return temp;
  }, [clientData, search, clientSort]);

  return (
    <Tabs className={styles.tabs} selectedTabId={tab} onChange={(t) => setTab(t)}>
      <Tab
        id="server-logs"
        title="Server Logs"
        panel={
          <div className={styles.table}>
            <Table
              rows={logs}
              columns={[
                { field: "type", label: "Type", type: "term" },
                { field: "message", label: "Message", type: "term" },
                { field: "createdAt", label: "Created", type: "date" },
                { field: "updatedAt", label: "Updated", type: "date" },
              ]}
              sort={sort}
              setSort={setSort}
            />
            <ControlGroup>
              <div className={styles.spacer} />
              <Paging length={data?.countLogs ?? 0} paging={paging} setPaging={setPaging} />
            </ControlGroup>
          </div>
        }
      />
      <Tab
        id="client-logs"
        title="Client Logs"
        panel={
          <div className={styles.table}>
            <Table
              rows={clientLogs}
              columns={[
                { field: "type", label: "Type", type: "term" },
                { field: "message", label: "Message", type: "term" },
                { field: "timestamp", label: "Timestamp", type: "date" },
              ]}
              sort={clientSort}
              setSort={setClientSort}
            />
            <ControlGroup>
              <div className={styles.spacer} />
              <Paging length={clientData.length} paging={clientPaging} setPaging={setClientPaging} />
            </ControlGroup>
          </div>
        }
      />
      <TabsExpander />
      <ControlGroup>
        {tab === "server-logs" && <Button loading={loading} icon={IconNames.REFRESH} onClick={() => refetch()} />}
        <Search value={search} onValueChange={setSearch} />
      </ControlGroup>
    </Tabs>
  );
}
