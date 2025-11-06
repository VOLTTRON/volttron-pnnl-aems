"use client";

import styles from "./page.module.scss";
import { Button, ControlGroup } from "@blueprintjs/core";
import { useContext, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import {
  ReadFeedbacksDocument,
  ReadFeedbacksQuery,
  FeedbackStatus as FeedbackStatusGql,
  StringFilterMode,
  User,
} from "@/graphql-codegen/graphql";
import { NotificationContext, NotificationType } from "../components/providers";
import { Term, filter } from "@/utils/client";
import { Paging, Search, Table } from "../components/common";
import { IconNames } from "@blueprintjs/icons";
import { ViewFeedback } from "./dialog";
import { FeedbackStatusType } from "@local/common";

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<
    NonNullable<ReadFeedbacksQuery["readFeedbacks"]>[0] | undefined
  >(undefined);

  const [sort, setSort] = useState<{
    field: keyof Term<NonNullable<ReadFeedbacksQuery["readFeedbacks"]>[0] & { fileCount: number }>;
    direction: "Asc" | "Desc";
  }>({
    field: "createdAt",
    direction: "Desc",
  });
  const [paging, setPaging] = useState({ take: 10, skip: 0 });

  const { createNotification } = useContext(NotificationContext);

  const { data, loading, refetch } = useQuery(ReadFeedbacksDocument, {
    fetchPolicy: "cache-and-network",
    variables: {
      orderBy: { [sort.field]: sort.direction },
      where: { message: { contains: search, mode: StringFilterMode.Insensitive } },
      paging: paging,
    },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const feedback = useMemo(
    () =>
      filter(data?.readFeedbacks ?? [], search, ["message"]).map((value) => ({
        ...value,
        fileCount: value.files?.length,
      })),
    [data?.readFeedbacks, search],
  );

  const handleExpand = async (row: any) => {
    setSelectedFeedback(row);
    setIsOpen(true);
  };

  return (
    <div className={styles.table}>
      <ViewFeedback open={isOpen} setOpen={setIsOpen} feedback={selectedFeedback} />
      <ControlGroup>
        <div className={styles.spacer} />
        <Button loading={loading} icon={IconNames.REFRESH} onClick={() => refetch()} />
        <Search value={search} onValueChange={setSearch} />
      </ControlGroup>
      <Table
        rowKey="id"
        rows={feedback}
        sortable={["status", "message", "createdAt", "updatedAt"]}
        columns={[
          {
            field: "status",
            label: "Status",
            type: "term",
            renderer: (_col: number, _row: number, value: FeedbackStatusGql) => (
              <span>{FeedbackStatusType[value].label}</span>
            ),
          },
          {
            field: "message",
            label: "Message",
            type: "element",
            renderer: (_col: number, _row: number, value: string) => (
              <span className={styles.messageEl}> {value} </span>
            ),
          },
          { field: "createdAt", label: "Created", type: "date" },
          { field: "updatedAt", label: "Updated", type: "date" },
          { field: "fileCount", label: "Files", type: "string" },
          {
            field: "assignee",
            label: "Assignee",
            type: "element",
            renderer: (_col: number, _row: number, value: User) => (
              <span className={styles.assigneeEl}>{value?.name || ""}</span>
            ),
          },
        ]}
        actions={{
          values: [{ id: "expand-feedback", icon: IconNames.MAXIMIZE }],
          onClick: (id, row) => {
            switch (id) {
              case "expand-feedback":
                handleExpand(row);
                return;
              default:
                return;
            }
          },
        }}
        sort={sort}
        setSort={setSort}
      />
      <ControlGroup>
        <div className={styles.spacer} />
        <Paging length={feedback.length} paging={paging} setPaging={setPaging} />
      </ControlGroup>
    </div>
  );
}
