"use client";

import styles from "./page.module.scss";
import { Button, ControlGroup, Intent } from "@blueprintjs/core";
import { useContext, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { ReadConfigurationsQuery, StringFilterMode, ReadConfigurationsDocument } from "@/graphql-codegen/graphql";
import { NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { Term, filter } from "@/utils/client";
import { Paging, Search, Table } from "../components/common";
import { IconNames } from "@blueprintjs/icons";
import { CreateConfiguration, DeleteConfiguration, UpdateConfiguration } from "./dialog";
import { DialogType } from "../types";

export default function Page() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    field: keyof Term<NonNullable<ReadConfigurationsQuery["readConfigurations"]>[0]>;
    direction: "Asc" | "Desc";
  }>({
    field: "createdAt",
    direction: "Desc",
  });
  const [paging, setPaging] = useState({ take: 10, skip: 0 });
  const [dialog, setDialog] = useState<{
    type: DialogType;
    configuration?: Term<NonNullable<ReadConfigurationsQuery["readConfigurations"]>[0]>;
  }>();

  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);

  const { data, loading, refetch } = useQuery(ReadConfigurationsDocument, {
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

  const configurations = useMemo(
    () => filter(data?.readConfigurations ?? [], search, ["label"]),
    [data?.readConfigurations, search],
  );

  return (
    <div className={styles.table}>
      <CreateConfiguration
        open={dialog?.type === DialogType.Create}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Create }) : setDialog(undefined))}
        icon={route?.data?.icon}
      />
      <UpdateConfiguration
        open={dialog?.type === DialogType.Update}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Update }) : setDialog(undefined))}
        icon={route?.data?.icon}
        configuration={dialog?.configuration}
      />
      <DeleteConfiguration
        open={dialog?.type === DialogType.Delete}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Delete }) : setDialog(undefined))}
        icon={route?.data?.icon}
        configuration={dialog?.configuration}
      />
      <ControlGroup>
        <div className={styles.spacer} />
        <Button loading={loading} icon={IconNames.REFRESH} onClick={() => refetch()} />
        <Search value={search} onValueChange={setSearch} />
        {/* <Button icon={route?.data?.icon} intent={Intent.PRIMARY} onClick={() => setDialog({ type: DialogType.Create })}>
          Create Configuration
        </Button> */}
      </ControlGroup>
      <Table
        rowKey="id"
        rows={configurations}
        columns={[
          { field: "label", label: "Label", type: "term" },
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
                setDialog({ type: DialogType.Update, configuration: row });
                return;
              case "delete":
                setDialog({ type: DialogType.Delete, configuration: row });
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
        <Paging length={configurations.length} paging={paging} setPaging={setPaging} />
      </ControlGroup>
    </div>
  );
}
