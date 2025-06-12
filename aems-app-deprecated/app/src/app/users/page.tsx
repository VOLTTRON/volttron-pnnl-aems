"use client";

import styles from "./page.module.scss";
import { Button, ControlGroup, Intent } from "@blueprintjs/core";
import { useContext, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { ReadUsersQuery, StringFilterMode, ReadUsersDocument } from "@/generated/graphql-codegen/graphql";
import { CurrentContext, NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { Term, filter } from "@/utils/client";
import { Paging, Search, Table } from "../components/common";
import { IconNames } from "@blueprintjs/icons";
import { CreateUser, DeleteUser, LoginAsUser, UpdateUser } from "./dialog";
import { DialogType } from "../types";
import { RoleType } from "@/common";

export default function Page() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    field: keyof Term<NonNullable<ReadUsersQuery["readUsers"]>[0]>;
    direction: "Asc" | "Desc";
  }>({
    field: "createdAt",
    direction: "Desc",
  });
  const [paging, setPaging] = useState({ take: 10, skip: 0 });
  const [dialog, setDialog] = useState<{
    type: DialogType;
    user?: Term<NonNullable<ReadUsersQuery["readUsers"]>[0]>;
  }>();

  const { current } = useContext(CurrentContext);
  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);

  const isSuperAdmin =
    RoleType.Admin.granted(...(current?.role?.split(" ") ?? [""])) &&
    RoleType.Super.granted(...(current?.role?.split(" ") ?? [""]));

  const { data, loading, refetch } = useQuery(ReadUsersDocument, {
    variables: {
      orderBy: { [sort.field]: sort.direction },
      where: {
        OR: [
          { name: { contains: search, mode: StringFilterMode.Insensitive } },
          { email: { contains: search, mode: StringFilterMode.Insensitive } },
          { role: { contains: search, mode: StringFilterMode.Insensitive } },
        ],
      },
      paging: paging,
    },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const users = useMemo(
    () => filter(data?.readUsers ?? [], search, ["name", "email", "role"]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.readUsers]
  );

  return (
    <div className={styles.table}>
      <CreateUser
        open={dialog?.type === DialogType.Create}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Create }) : setDialog(undefined))}
        icon={route?.data?.icon}
      />
      <UpdateUser
        open={dialog?.type === DialogType.Update}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Update }) : setDialog(undefined))}
        icon={route?.data?.icon}
        user={dialog?.user}
      />
      <DeleteUser
        open={dialog?.type === DialogType.Delete}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Delete }) : setDialog(undefined))}
        icon={route?.data?.icon}
        user={dialog?.user}
      />
      <LoginAsUser
        open={dialog?.type === DialogType.Confirm}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Confirm }) : setDialog(undefined))}
        icon={route?.data?.icon}
        user={dialog?.user}
      />
      <ControlGroup>
        <div className={styles.spacer} />
        <Button loading={loading} icon={IconNames.REFRESH} onClick={() => refetch()} />
        <Search value={search} onValueChange={setSearch} />
        <Button icon={route?.data?.icon} intent={Intent.PRIMARY} onClick={() => setDialog({ type: DialogType.Create })}>
          Create User
        </Button>
      </ControlGroup>
      <Table
        rowKey="id"
        rows={users}
        columns={[
          { field: "name", label: "Name", type: "term" },
          { field: "email", label: "Email", type: "term" },
          { field: "role", label: "Role", type: "term" },
          { field: "createdAt", label: "Created", type: "date" },
          { field: "updatedAt", label: "Updated", type: "date" },
        ]}
        actions={{
          values: [
            ...(isSuperAdmin ? [{ id: "login-as-user", icon: IconNames.EYE_OPEN, intent: Intent.PRIMARY }] : []),
            { id: "update", icon: IconNames.EDIT, intent: Intent.PRIMARY },
            { id: "delete", icon: IconNames.TRASH, intent: Intent.DANGER },
          ],
          onClick: (id, row) => {
            switch (id) {
              case "login-as-user":
                setDialog({ type: DialogType.Confirm, user: row });
                return;
              case "update":
                setDialog({ type: DialogType.Update, user: row });
                return;
              case "delete":
                setDialog({ type: DialogType.Delete, user: row });
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
        <Paging length={data?.countUsers ?? 0} paging={paging} setPaging={setPaging} />
      </ControlGroup>
    </div>
  );
}
