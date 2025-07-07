"use client";

import styles from "./page.module.scss";
import { Button, ControlGroup, Intent } from "@blueprintjs/core";
import { useContext, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { ReadChangesQuery, StringFilterMode, ReadChangesDocument } from "@/graphql-codegen/graphql";
import { NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { Term, filter } from "@/utils/client";
import { Paging, Search, Table } from "../components/common";
import { IconNames } from "@blueprintjs/icons";
import { ViewChange } from "./dialog";
import { DialogType } from "../types";

export default function Page() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    field: keyof Term<NonNullable<ReadChangesQuery["readChanges"]>[0]> | "user.name" | "user.email";
    direction: "Asc" | "Desc";
  }>({
    field: "createdAt",
    direction: "Desc",
  });
  const [paging, setPaging] = useState({ take: 10, skip: 0 });
  const [dialog, setDialog] = useState<{
    type: DialogType;
    change?: Term<NonNullable<ReadChangesQuery["readChanges"]>[0]>;
  }>();
  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);

  const { data, loading, refetch } = useQuery(ReadChangesDocument, {
    variables: {
      orderBy: { [sort.field]: sort.direction },
      where: {
        OR: [
          { table: { contains: search, mode: StringFilterMode.Insensitive } },
          { key: { contains: search, mode: StringFilterMode.Insensitive } },
          { user: { name: { contains: search, mode: StringFilterMode.Insensitive } } },
          { user: { email: { contains: search, mode: StringFilterMode.Insensitive } } },
        ],
      },
      paging: paging,
    },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const changes = useMemo(
    () =>
      filter(
        data?.readChanges?.map((v) => ({
          ...v,
          ["user.name"]: v.user?.name ?? "",
          ["user.email"]: v.user?.email ?? "",
        })) ?? [],
        search,
        ["table", "key", "user.name", "user.email"]
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.readChanges]
  );

  return (
    <div className={styles.table}>
      <ViewChange
        open={dialog?.type === DialogType.View}
        setOpen={(v: boolean) => (v ? setDialog({ type: DialogType.View }) : setDialog(undefined))}
        icon={route?.data?.icon}
      />
      <ControlGroup>
        <div className={styles.spacer} />
        <Button loading={loading} icon={IconNames.REFRESH} onClick={() => refetch()} />
        <Search value={search} onValueChange={setSearch} />
      </ControlGroup>
      <Table
        rowKey="id"
        rows={changes}
        columns={[
          { field: "table", label: "Table", type: "term" },
          { field: "key", label: "ID", type: "term" },
          { field: "mutation", label: "Type", type: "term" },
          { field: "user.name", label: "Name", type: "term" },
          { field: "user.email", label: "Email", type: "term" },
          { field: "createdAt", label: "Changed", type: "date" },
        ]}
        actions={{
          values: [{ id: "view", icon: IconNames.OPEN_APPLICATION, intent: Intent.PRIMARY }],
          onClick: (id, row) => {
            switch (id) {
              case "view":
                setDialog({ type: DialogType.View, change: row });
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
        <Paging length={data?.countChanges ?? 0} paging={paging} setPaging={setPaging} />
      </ControlGroup>
    </div>
  );
}
