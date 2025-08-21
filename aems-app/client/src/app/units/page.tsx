"use client";

import styles from "./page.module.scss";
import { Button, ControlGroup, Intent } from "@blueprintjs/core";
import { useContext, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { ReadUnitsQuery, StringFilterMode, ReadUnitsDocument } from "@/graphql-codegen/graphql";
import { NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { Term, filter } from "@/utils/client";
import { Paging, Search, Table } from "../components/common";
import { IconNames } from "@blueprintjs/icons";
import { CreateUnit, DeleteUnit, UpdateUnit } from "./dialog";
import { DialogType } from "../types";

// Status color mapping for unit stages
const getStatusIntent = (stage?: string | null) => {
  switch (stage?.toLowerCase()) {
    case "complete":
      return Intent.SUCCESS;
    case "update":
    case "process":
      return Intent.PRIMARY;
    case "create":
      return Intent.WARNING;
    case "delete":
    case "fail":
      return Intent.DANGER;
    default:
      return Intent.NONE;
  }
};

export default function Page() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    field: keyof Term<NonNullable<ReadUnitsQuery["readUnits"]>[0]>;
    direction: "Asc" | "Desc";
  }>({
    field: "createdAt",
    direction: "Desc",
  });
  const [paging, setPaging] = useState({ take: 10, skip: 0 });
  const [dialog, setDialog] = useState<{
    type: DialogType;
    unit?: Term<NonNullable<ReadUnitsQuery["readUnits"]>[0]>;
  }>();

  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);

  const { data, loading, refetch } = useQuery(ReadUnitsDocument, {
    variables: {
      orderBy: { [sort.field]: sort.direction },
      where: {
        OR: [
          { label: { contains: search, mode: StringFilterMode.Insensitive } },
          { name: { contains: search, mode: StringFilterMode.Insensitive } },
          { campus: { contains: search, mode: StringFilterMode.Insensitive } },
          { building: { contains: search, mode: StringFilterMode.Insensitive } },
          { system: { contains: search, mode: StringFilterMode.Insensitive } },
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

  const units = useMemo(
    () => filter(data?.readUnits ?? [], search, ["label", "name", "campus", "building", "system", "correlation", "message"]),
    [data?.readUnits, search],
  );

  return (
    <div className={styles.table}>
      <CreateUnit
        open={dialog?.type === DialogType.Create}
        setOpen={(v: boolean) => (v ? setDialog({ type: DialogType.Create }) : setDialog(undefined))}
        icon={route?.data?.icon}
      />
      <UpdateUnit
        open={dialog?.type === DialogType.Update}
        setOpen={(v: boolean) => (v ? setDialog({ type: DialogType.Update }) : setDialog(undefined))}
        icon={route?.data?.icon}
        unit={dialog?.unit}
      />
      <DeleteUnit
        open={dialog?.type === DialogType.Delete}
        setOpen={(v: boolean) => (v ? setDialog({ type: DialogType.Delete }) : setDialog(undefined))}
        icon={route?.data?.icon}
        unit={dialog?.unit}
      />
      <ControlGroup>
        <div className={styles.spacer} />
        <Button loading={loading} icon={IconNames.REFRESH} onClick={() => refetch()} />
        <Search value={search} onValueChange={setSearch} />
        <Button icon={route?.data?.icon} intent={Intent.PRIMARY} onClick={() => setDialog({ type: DialogType.Create })}>
          Create Unit
        </Button>
      </ControlGroup>
      <Table
        rowKey="id"
        rows={units}
        columns={[
          { field: "label", label: "Label", type: "term" },
          { field: "name", label: "Name", type: "term" },
          { field: "campus", label: "Campus", type: "term" },
          { field: "building", label: "Building", type: "term" },
          { field: "system", label: "System", type: "term" },
          { field: "stage", label: "Stage", type: "term" },
          { field: "timezone", label: "Timezone", type: "term" },
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
                setDialog({ type: DialogType.Update, unit: row });
                return;
              case "delete":
                setDialog({ type: DialogType.Delete, unit: row });
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
        <Paging length={units.length} paging={paging} setPaging={setPaging} />
      </ControlGroup>
    </div>
  );
}
