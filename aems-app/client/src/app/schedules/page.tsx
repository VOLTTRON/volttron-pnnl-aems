"use client";

import styles from "./page.module.scss";
import { Button, ControlGroup, Intent } from "@blueprintjs/core";
import { useContext, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { ReadSchedulesQuery, StringFilterMode, ReadSchedulesDocument } from "@/graphql-codegen/graphql";
import { NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { Term, filter } from "@/utils/client";
import { Paging, Search, Table } from "../components/common";
import { IconNames } from "@blueprintjs/icons";
import { CreateSchedule, DeleteSchedule, UpdateSchedule } from "./dialog";
import { DialogType } from "../types";

export default function Page() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    field: keyof Term<NonNullable<ReadSchedulesQuery["readSchedules"]>[0]>;
    direction: "Asc" | "Desc";
  }>({
    field: "createdAt",
    direction: "Desc",
  });
  const [paging, setPaging] = useState({ take: 10, skip: 0 });
  const [dialog, setDialog] = useState<{
    type: DialogType;
    schedule?: Term<NonNullable<ReadSchedulesQuery["readSchedules"]>[0]>;
  }>();

  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);

  const { data, loading, refetch } = useQuery(ReadSchedulesDocument, {
    variables: {
      orderBy: { [sort.field]: sort.direction },
      where: {
        OR: [
          { label: { contains: search, mode: StringFilterMode.Insensitive } },
          { correlation: { contains: search, mode: StringFilterMode.Insensitive } },
          { message: { contains: search, mode: StringFilterMode.Insensitive } },
        ],
      },
      paging: paging,
    },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const schedules = useMemo(
    () => filter(data?.readSchedules ?? [], search, ["label", "correlation", "message"]),
    [data?.readSchedules, search],
  );

  return (
    <div className={styles.table}>
      <CreateSchedule
        open={dialog?.type === DialogType.Create}
        setOpen={(v: boolean) => (v ? setDialog({ type: DialogType.Create }) : setDialog(undefined))}
        icon={route?.data?.icon}
      />
      <UpdateSchedule
        open={dialog?.type === DialogType.Update}
        setOpen={(v: boolean) => (v ? setDialog({ type: DialogType.Update }) : setDialog(undefined))}
        icon={route?.data?.icon}
        schedule={dialog?.schedule}
      />
      <DeleteSchedule
        open={dialog?.type === DialogType.Delete}
        setOpen={(v: boolean) => (v ? setDialog({ type: DialogType.Delete }) : setDialog(undefined))}
        icon={route?.data?.icon}
        schedule={dialog?.schedule}
      />
      <ControlGroup>
        <div className={styles.spacer} />
        <Button loading={loading} icon={IconNames.REFRESH} onClick={() => refetch()} />
        <Search value={search} onValueChange={setSearch} />
        <Button icon={route?.data?.icon} intent={Intent.PRIMARY} onClick={() => setDialog({ type: DialogType.Create })}>
          Create Schedule
        </Button>
      </ControlGroup>
      <Table
        rowKey="id"
        rows={schedules}
        columns={[
          { field: "label", label: "Label", type: "term" },
          { field: "startTime", label: "Start Time", type: "term" },
          { field: "endTime", label: "End Time", type: "term" },
          { field: "occupied", label: "Occupied", type: "term", renderer: (col, row, value) => value ? "Yes" : "No" },
          { field: "setpoint", label: "Setpoint", type: "term", renderer: (col, row, value) => value?.label || "—" },
          { field: "correlation", label: "Correlation", type: "term" },
          { field: "createdAt", label: "Created", type: "date" },
          { field: "updatedAt", label: "Updated", type: "date" },
        ]}
        actions={{
          values: [
            { id: "update", icon: IconNames.EDIT, intent: Intent.PRIMARY },
            { id: "delete", icon: IconNames.TRASH, intent: Intent.DANGER },
          ],
          onClick: (id, row) => {
            switch (id) {
              case "update":
                setDialog({ type: DialogType.Update, schedule: row });
                return;
              case "delete":
                setDialog({ type: DialogType.Delete, schedule: row });
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
        <Paging length={schedules.length} paging={paging} setPaging={setPaging} />
      </ControlGroup>
    </div>
  );
}
