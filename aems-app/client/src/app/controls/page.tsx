"use client";

import styles from "./page.module.scss";
import { Button, ControlGroup, Intent } from "@blueprintjs/core";
import { useContext, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { ReadControlsQuery, StringFilterMode, ReadControlsDocument } from "@/graphql-codegen/graphql";
import { NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { Term, filter } from "@/utils/client";
import { Paging, Search, Table } from "../components/common";
import { IconNames } from "@blueprintjs/icons";
import { CreateControl, DeleteControl, UpdateControl } from "./dialog";
import { DialogType } from "../types";

export default function Page() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    field: keyof Term<NonNullable<ReadControlsQuery["readControls"]>[0]>;
    direction: "Asc" | "Desc";
  }>({
    field: "createdAt",
    direction: "Desc",
  });
  const [paging, setPaging] = useState({ take: 10, skip: 0 });
  const [dialog, setDialog] = useState<{
    type: DialogType;
    control?: Term<NonNullable<ReadControlsQuery["readControls"]>[0]>;
  }>();

  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);

  const { data, loading, refetch } = useQuery(ReadControlsDocument, {
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

  const controls = useMemo(
    () => filter(data?.readControls ?? [], search, ["label", "correlation", "message"]),
    [data?.readControls, search],
  );

  return (
    <div className={styles.table}>
      <CreateControl
        open={dialog?.type === DialogType.Create}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Create }) : setDialog(undefined))}
        icon={route?.data?.icon}
      />
      <UpdateControl
        open={dialog?.type === DialogType.Update}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Update }) : setDialog(undefined))}
        icon={route?.data?.icon}
        control={dialog?.control}
      />
      <DeleteControl
        open={dialog?.type === DialogType.Delete}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Delete }) : setDialog(undefined))}
        icon={route?.data?.icon}
        control={dialog?.control}
      />
      <ControlGroup>
        <div className={styles.spacer} />
        <Button loading={loading} icon={IconNames.REFRESH} onClick={() => refetch()} />
        <Search value={search} onValueChange={setSearch} />
        <Button icon={route?.data?.icon} intent={Intent.PRIMARY} onClick={() => setDialog({ type: DialogType.Create })}>
          Create Control
        </Button>
      </ControlGroup>
      <Table
        rowKey="id"
        rows={controls}
        columns={[
          { field: "label", label: "Label", type: "term" },
          { field: "stage", label: "Stage", type: "term" },
          { field: "correlation", label: "Correlation", type: "term" },
          { field: "message", label: "Message", type: "term" },
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
                setDialog({ type: DialogType.Update, control: row });
                return;
              case "delete":
                setDialog({ type: DialogType.Delete, control: row });
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
        <Paging length={data?.readControls?.length ?? 0} paging={paging} setPaging={setPaging} />
      </ControlGroup>
    </div>
  );
}
