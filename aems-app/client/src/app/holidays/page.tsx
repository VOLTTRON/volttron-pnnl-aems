"use client";

import styles from "./page.module.scss";
import { Button, ControlGroup, Intent } from "@blueprintjs/core";
import { useContext, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { ReadHolidaysQuery, StringFilterMode, ReadHolidaysDocument } from "@/graphql-codegen/graphql";
import { NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { Term, filter } from "@/utils/client";
import { Paging, Search, Table } from "../components/common";
import { IconNames } from "@blueprintjs/icons";
import { CreateHoliday, DeleteHoliday, UpdateHoliday } from "./dialog";
import { DialogType } from "../types";

export default function Page() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    field: keyof Term<NonNullable<ReadHolidaysQuery["readHolidays"]>[0]>;
    direction: "Asc" | "Desc";
  }>({
    field: "month",
    direction: "Asc",
  });
  const [paging, setPaging] = useState({ take: 10, skip: 0 });
  const [dialog, setDialog] = useState<{
    type: DialogType;
    holiday?: Term<NonNullable<ReadHolidaysQuery["readHolidays"]>[0]>;
  }>();

  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);

  const { data, loading, refetch } = useQuery(ReadHolidaysDocument, {
    variables: {
      orderBy: { [sort.field]: sort.direction },
      where: {
        OR: [{ label: { contains: search, mode: StringFilterMode.Insensitive } }],
      },
      paging: paging,
    },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const holidays = useMemo(() => filter(data?.readHolidays ?? [], search, ["label"]), [data?.readHolidays, search]);

  return (
    <div className={styles.table}>
      <CreateHoliday
        open={dialog?.type === DialogType.Create}
        setOpen={(v: boolean) => (v ? setDialog({ type: DialogType.Create }) : setDialog(undefined))}
        icon={route?.data?.icon}
      />
      <UpdateHoliday
        open={dialog?.type === DialogType.Update}
        setOpen={(v: boolean) => (v ? setDialog({ type: DialogType.Update }) : setDialog(undefined))}
        icon={route?.data?.icon}
        holiday={dialog?.holiday}
      />
      <DeleteHoliday
        open={dialog?.type === DialogType.Delete}
        setOpen={(v: boolean) => (v ? setDialog({ type: DialogType.Delete }) : setDialog(undefined))}
        icon={route?.data?.icon}
        holiday={dialog?.holiday}
      />
      <ControlGroup>
        <div className={styles.spacer} />
        <Button loading={loading} icon={IconNames.REFRESH} onClick={() => refetch()} />
        <Search value={search} onValueChange={setSearch} />
        {/* <Button icon={route?.data?.icon} intent={Intent.PRIMARY} onClick={() => setDialog({ type: DialogType.Create })}>
          Create Holiday
        </Button> */}
      </ControlGroup>
      <Table
        rowKey="id"
        rows={holidays}
        columns={[
          { field: "label", label: "Label", type: "term" },
          { field: "month", label: "Month", type: "string" },
          { field: "day", label: "Day", type: "string" },
          { field: "observance", label: "Observance", type: "string" },
          { field: "type", label: "Type", type: "string" },
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
                setDialog({ type: DialogType.Update, holiday: row });
                return;
              case "delete":
                setDialog({ type: DialogType.Delete, holiday: row });
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
        <Paging length={holidays.length} paging={paging} setPaging={setPaging} />
      </ControlGroup>
    </div>
  );
}
