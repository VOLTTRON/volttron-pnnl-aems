"use client";

import { FormGroup, InputGroup } from "@blueprintjs/core";
import React from "react";
import { IconName } from "@blueprintjs/icons";
import { ReadChangesQuery } from "@/graphql-codegen/graphql";
import { Term } from "@/utils/client";
import { ViewDialog } from "../dialog";

export function ViewChange({
  open,
  setOpen,
  icon,
  change,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  change?: Term<NonNullable<ReadChangesQuery["readChanges"]>[0]>;
}) {
  const { table, key, mutation, data } = change ?? {};
  return (
    <ViewDialog title="View Change" icon={icon} open={open} setOpen={setOpen}>
      <FormGroup label="Table">
        <InputGroup id="table" name="table" value={table ?? ""} fill />
      </FormGroup>
      <FormGroup label="ID">
        <InputGroup id="id" name="id" value={key ?? ""} fill />
      </FormGroup>
      <FormGroup label="Mutation">
        <InputGroup id="mutation" name="mutation" value={mutation ?? ""} fill />
      </FormGroup>
      <FormGroup label="Data">
        <InputGroup id="data" name="data" value={JSON.stringify(data ?? {}, null, 2)} fill />
      </FormGroup>
    </ViewDialog>
  );
}
