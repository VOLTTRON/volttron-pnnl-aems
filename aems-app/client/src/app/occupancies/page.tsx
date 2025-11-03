"use client";

import styles from "./page.module.scss";
import { Button, ControlGroup, Intent } from "@blueprintjs/core";
import { useContext, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { ReadOccupanciesQuery, StringFilterMode, ReadOccupanciesDocument } from "@/graphql-codegen/graphql";
import { NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { Term, filter } from "@/utils/client";
import { Paging, Search, Table } from "../components/common";
import { IconNames } from "@blueprintjs/icons";
import { CreateOccupancy, DeleteOccupancy, UpdateOccupancy } from "./dialog";
import { DialogType } from "../types";

export default function Page() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    field: keyof Term<NonNullable<ReadOccupanciesQuery["readOccupancies"]>[0]>;
    direction: "Asc" | "Desc";
  }>({
    field: "createdAt",
    direction: "Desc",
  });
  const [paging, setPaging] = useState({ take: 10, skip: 0 });
  const [dialog, setDialog] = useState<{
    type: DialogType;
    occupancy?: Term<NonNullable<ReadOccupanciesQuery["readOccupancies"]>[0]>;
  }>();

  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);

  const { data, loading, refetch } = useQuery(ReadOccupanciesDocument, {
    variables: {
      orderBy: { [sort.field]: sort.direction },
      where: {
        OR: [
          { label: { contains: search, mode: StringFilterMode.Insensitive } },
        ],
      },
      paging: paging,
    },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const occupancies = useMemo(
    () => filter(data?.readOccupancies ?? [], search, ["label"]),
    [data?.readOccupancies, search],
  );

  return (
    <div className={styles.table}>
      <CreateOccupancy
        open={dialog?.type === DialogType.Create}
        setOpen={(v: boolean) => (v ? setDialog({ type: DialogType.Create }) : setDialog(undefined))}
        icon={route?.data?.icon}
      />
      <UpdateOccupancy
        open={dialog?.type === DialogType.Update}
        setOpen={(v: boolean) => (v ? setDialog({ type: DialogType.Update }) : setDialog(undefined))}
        icon={route?.data?.icon}
        occupancy={dialog?.occupancy}
      />
      <DeleteOccupancy
        open={dialog?.type === DialogType.Delete}
        setOpen={(v: boolean) => (v ? setDialog({ type: DialogType.Delete }) : setDialog(undefined))}
        icon={route?.data?.icon}
        occupancy={dialog?.occupancy}
      />
      <ControlGroup>
        <div className={styles.spacer} />
        <Button loading={loading} icon={IconNames.REFRESH} onClick={() => refetch()} />
        <Search value={search} onValueChange={setSearch} />
        {/* <Button icon={route?.data?.icon} intent={Intent.PRIMARY} onClick={() => setDialog({ type: DialogType.Create })}>
          Create Occupancy
        </Button> */}
      </ControlGroup>
      <Table
        rowKey="id"
        rows={occupancies}
        columns={[
          { field: "label", label: "Label", type: "term" },
          { field: "date", label: "Date", type: "date" },
          { field: "configuration", label: "Configuration", type: "term", renderer: (col, row, value) => value?.label || "—" },
          { field: "schedule", label: "Schedule", type: "term", renderer: (col, row, value) => value?.label || "—" },
          { field: "createdAt", label: "Created", type: "date" },
          { field: "updatedAt", label: "Updated", type: "date" },
        ]}
        actions={{
          values: [
            { id: "update", icon: IconNames.EDIT, intent: Intent.PRIMARY },
            // { id: "delete", icon: IconNames.TRASH, intent: Intent.DANGER },
          ],
          onClick: (id, row) => {
            switch (id) {
              case "update":
                setDialog({ type: DialogType.Update, occupancy: row });
                return;
              case "delete":
                setDialog({ type: DialogType.Delete, occupancy: row });
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
        <Paging length={occupancies.length} paging={paging} setPaging={setPaging} />
      </ControlGroup>
    </div>
  );
}
