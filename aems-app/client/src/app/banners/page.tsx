"use client";

import styles from "./page.module.scss";
import { Button, ControlGroup, Intent } from "@blueprintjs/core";
import { useContext, useMemo, useState } from "react";
import { useSubscription } from "@apollo/client";
import { ReadBannersQuery, StringFilterMode, SubscribeBannersDocument } from "@/graphql-codegen/graphql";
import { NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { Term, filter } from "@/utils/client";
import { CreateBanner, DeleteBanner, UpdateBanner } from "./dialog";
import { Search, Table } from "../components/common";
import { IconNames } from "@blueprintjs/icons";
import { DialogType } from "../types";

export default function Page() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    field: keyof Term<NonNullable<ReadBannersQuery["readBanners"]>[0]>;
    direction: "Asc" | "Desc";
  }>({
    field: "createdAt",
    direction: "Desc",
  });
  const [dialog, setDialog] = useState<{
    type: DialogType;
    log?: Term<NonNullable<ReadBannersQuery["readBanners"]>[0]>;
  }>();

  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);

  const { data } = useSubscription(SubscribeBannersDocument, {
    variables: {
      where: { message: { contains: search, mode: StringFilterMode.Insensitive } },
      orderBy: { [sort.field]: sort.direction },
    },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const banners = useMemo(() => filter(data?.readBanners ?? [], search, ["message"]), [data?.readBanners, search]);

  return (
    <div className={styles.table}>
      <CreateBanner
        open={dialog?.type === DialogType.Create}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Create }) : setDialog(undefined))}
        icon={route?.data?.icon}
      />
      <UpdateBanner
        open={dialog?.type === DialogType.Update}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Update }) : setDialog(undefined))}
        icon={route?.data?.icon}
        banner={dialog?.log}
      />
      <DeleteBanner
        open={dialog?.type === DialogType.Delete}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Delete }) : setDialog(undefined))}
        icon={route?.data?.icon}
        banner={dialog?.log}
      />
      <ControlGroup>
        <div className={styles.spacer} />
        <Search value={search} onValueChange={setSearch} />
        <Button icon={route?.data?.icon} intent={Intent.PRIMARY} onClick={() => setDialog({ type: DialogType.Create })}>
          Create Banner
        </Button>
      </ControlGroup>
      <Table
        rowKey="id"
        rows={banners}
        columns={[
          { field: "message", label: "Message", type: "term" },
          { field: "expiration", label: "Expiration", type: "date" },
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
                setDialog({ type: DialogType.Update, log: row });
                return;
              case "delete":
                setDialog({ type: DialogType.Delete, log: row });
                return;
              default:
                return;
            }
          },
        }}
        sort={sort}
        setSort={setSort}
      />
    </div>
  );
}
