"use client";

import { Checkbox, FormGroup, InputGroup } from "@blueprintjs/core";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { IconName } from "@blueprintjs/icons";
import {
  ReadUsersDocument,
  ReadUsersQuery,
  DeleteUserDocument,
  CreateUserDocument,
  UpdateUserDocument,
} from "@/generated/graphql-codegen/graphql";
import { useMutation } from "@apollo/client";
import { Term } from "@/utils/client";
import { RoleType } from "@/common";
import { xor } from "lodash";
import { ConfirmDialog, CreateDialog, DeleteDialog, UpdateDialog } from "../dialog";
import { CurrentContext } from "../components/providers";

export function CreateUser({
  open,
  setOpen,
  icon,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const [createUser] = useMutation(CreateUserDocument, {
    refetchQueries: [ReadUsersDocument],
  });

  const onCreate = useCallback(async () => {
    await createUser({
      variables: {
        create: {
          name,
          email,
          password,
          role,
        },
      },
    });
  }, [createUser, name, email, password, role]);

  useEffect(() => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("");
  }, [open]);

  return (
    <CreateDialog title="Create User" icon={icon} open={open} setOpen={setOpen} onCreate={onCreate}>
      <FormGroup label="Name">
        <InputGroup id="name" name="name" value={name} onChange={(event) => setName(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Email">
        <InputGroup id="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Password">
        <InputGroup
          id="password"
          name="new-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Role">
        {RoleType.values.map((r) => (
          <Checkbox
            key={`role-${r.name}`}
            id={`role-${r.name}`}
            label={r.label}
            checked={role.includes(r.name)}
            indeterminate={!role.includes(r.name) && r.granted(...role.split(" "))}
            onClick={() => setRole(xor(role.split(" "), [r.name]).sort().join(" "))}
            inline
          />
        ))}
      </FormGroup>
    </CreateDialog>
  );
}

export function UpdateUser({
  open,
  setOpen,
  icon,
  user,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  user?: Term<NonNullable<ReadUsersQuery["readUsers"]>[0]>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const { current, refetchCurrent } = useContext(CurrentContext);

  const [updateUser] = useMutation(UpdateUserDocument, {
    refetchQueries: [ReadUsersDocument],
  });

  const onUpdate = useCallback(async () => {
    await updateUser({
      variables: {
        where: { id: user?.id },
        update: {
          ...(name !== user?.name && { name }),
          ...(email !== user?.email && { email }),
          ...(password && { password }),
          ...(role !== user?.role && { role }),
        },
      },
    }).then(async () => {
      if (user?.id === current?.id) {
        await refetchCurrent?.();
      }
    });
  }, [updateUser, user, name, email, password, role, current, refetchCurrent]);

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPassword("");
    setRole(user?.role ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <UpdateDialog title="Update User" icon={icon} open={open} setOpen={setOpen} onUpdate={onUpdate}>
      <FormGroup label="Name">
        <InputGroup id="name" name="name" value={name} onChange={(event) => setName(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Email">
        <InputGroup id="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Password">
        <InputGroup
          id="password"
          name="new-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Role">
        {RoleType.values.map((r) => (
          <Checkbox
            key={`role-${r.name}`}
            id={`role-${r.name}`}
            label={r.label}
            checked={role.includes(r.name)}
            indeterminate={!role.includes(r.name) && r.granted(...role.split(" "))}
            onClick={() => setRole(xor(role.split(" "), [r.name]).sort().join(" "))}
            inline
          />
        ))}
      </FormGroup>
    </UpdateDialog>
  );
}

export function DeleteUser({
  open,
  setOpen,
  icon,
  user,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  user?: Term<NonNullable<ReadUsersQuery["readUsers"]>[0]>;
}) {
  const [deleteUser] = useMutation(DeleteUserDocument, {
    refetchQueries: [ReadUsersDocument],
  });

  const onDelete = useCallback(async () => {
    await deleteUser({
      variables: {
        where: { id: user?.id },
      },
    });
  }, [deleteUser, user]);

  return (
    <DeleteDialog title="Delete User" icon={icon} open={open} setOpen={setOpen} onDelete={onDelete}>
      <p>{`Are you sure you want to delete the user '${user?.name ?? user?.email}'?`}</p>
    </DeleteDialog>
  );
}

export function LoginAsUser({
  open,
  setOpen,
  icon,
  user,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  user?: Term<NonNullable<ReadUsersQuery["readUsers"]>[0]>;
}) {
  const { refetchCurrent } = useContext(CurrentContext);

  const onConfirm = useCallback(async () => {
    return fetch(`/api/auth/super/login`, {
      method: "POST",
      redirect: "follow",
      body: JSON.stringify({ id: user?.id }),
    }).then(async () => {
      await refetchCurrent?.();
    });
  }, [user, refetchCurrent]);

  return (
    <ConfirmDialog title="Login As User" icon={icon} open={open} setOpen={setOpen} onConfirm={onConfirm}>
      <p>{`Are you sure you want to login as the user '${user?.name ?? user?.email}'?`}</p>
    </ConfirmDialog>
  );
}
