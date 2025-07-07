"use client";

import styles from "./page.module.scss";
import { Button, ControlGroup, Intent } from "@blueprintjs/core";
import { useContext, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { ReadSetpointsQuery, StringFilterMode, ReadSetpointsDocument } from "@/graphql-codegen/graphql";
import { NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { Term, filter } from "@/utils/client";
import { Paging, Search, Table } from "../components/common";
import { IconNames } from "@blueprintjs/icons";
import { CreateSetpoint, DeleteSetpoint, UpdateSetpoint } from "./dialog";
import { DialogType } from "../types";

export default function Page() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    field: keyof Term<NonNullable<ReadSetpointsQuery["readSetpoints"]>[0]>;
    direction: "Asc" | "Desc";
  }>({
    field: "createdAt",
    direction: "Desc",
  });
  const [paging, setPaging] = useState({ take: 10, skip: 0 });
  const [dialog, setDialog] = useState<{
    type: DialogType;
    setpoint?: Term<NonNullable<ReadSetpointsQuery["readSetpoints"]>[0]>;
  }>();

  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);

  const { data, loading, refetch } = useQuery(ReadSetpointsDocument, {
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

  const setpoints = useMemo(
    () => filter(data?.readSetpoints ?? [], search, ["label", "correlation", "message"]),
    [data?.readSetpoints, search],
  );

  return (
    <div className={styles.table}>
      <CreateSetpoint
        open={dialog?.type === DialogType.Create}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Create }) : setDialog(undefined))}
        icon={route?.data?.icon}
      />
      <UpdateSetpoint
        open={dialog?.type === DialogType.Update}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Update }) : setDialog(undefined))}
        icon={route?.data?.icon}
        setpoint={dialog?.setpoint}
      />
      <DeleteSetpoint
        open={dialog?.type === DialogType.Delete}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Delete }) : setDialog(undefined))}
        icon={route?.data?.icon}
        setpoint={dialog?.setpoint}
      />
      <ControlGroup>
        <div className={styles.spacer} />
        <Button loading={loading} icon={IconNames.REFRESH} onClick={() => refetch()} />
        <Search value={search} onValueChange={setSearch} />
        <Button icon={route?.data?.icon} intent={Intent.PRIMARY} onClick={() => setDialog({ type: DialogType.Create })}>
          Create Setpoint
        </Button>
      </ControlGroup>
      <Table
        rowKey="id"
        rows={setpoints}
        columns={[
          { field: "label", label: "Label", type: "term" },
          { field: "setpoint", label: "Setpoint", type: "term" },
          { field: "deadband", label: "Deadband", type: "term" },
          { field: "heating", label: "Heating", type: "term" },
          { field: "cooling", label: "Cooling", type: "term" },
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
                setDialog({ type: DialogType.Update, setpoint: row });
                return;
              case "delete":
                setDialog({ type: DialogType.Delete, setpoint: row });
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
        <Paging length={data?.countSetpoints ?? 0} paging={paging} setPaging={setPaging} />
      </ControlGroup>
    </div>
  );
}
