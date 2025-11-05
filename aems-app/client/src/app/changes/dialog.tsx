"use client";

import { Card, FormGroup, InputGroup } from "@blueprintjs/core";
import React, { useCallback, useContext } from "react";
import { IconName } from "@blueprintjs/icons";
import { DeleteChangeDocument, ReadChangesDocument, ReadChangesQuery } from "@/graphql-codegen/graphql";
import { DeleteDialog, ViewDialog } from "../dialog";
import { JsonView, allExpanded, darkStyles, defaultStyles } from "react-json-view-lite";
import { compilePreferences, CurrentContext, PreferencesContext } from "../components/providers";
import "react-json-view-lite/dist/index.css";
import { useMutation } from "@apollo/client";

const darkStyle = { ...darkStyles, container: "_GzYRV" };
const lightStyle = { ...defaultStyles, container: "_GzYRV" };

export function ViewChange({
  open,
  setOpen,
  icon,
  change,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  change?: NonNullable<ReadChangesQuery["readChanges"]>[0];
}) {
  const { preferences } = useContext(PreferencesContext);
  const { current } = useContext(CurrentContext);

  const { mode } = compilePreferences(preferences, current?.preferences);

  const { table, mutation, data } = change ?? {};
  const label =
    data !== null && typeof data === "object"
      ? "label" in data && typeof data.label === "string"
        ? data.label
        : ""
      : "";
  return (
    <ViewDialog title="View Change" icon={icon} open={open} setOpen={setOpen}>
      <FormGroup label="Table">
        <InputGroup id="table" name="table" value={table ?? ""} fill />
      </FormGroup>
      <FormGroup label="Label">
        <InputGroup id="label" name="label" value={label ?? ""} fill />
      </FormGroup>
      <FormGroup label="Mutation">
        <InputGroup id="mutation" name="mutation" value={mutation ?? ""} fill />
      </FormGroup>
      <FormGroup label="Data">
        <Card>
          <JsonView data={data ?? {}} shouldExpandNode={allExpanded} style={mode === "dark" ? darkStyle : lightStyle} />
        </Card>
      </FormGroup>
    </ViewDialog>
  );
}

export function DeleteChange({
  open,
  setOpen,
  icon,
  change,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  change?: NonNullable<ReadChangesQuery["readChanges"]>[0];
}) {
  const [deleteChange] = useMutation(DeleteChangeDocument, {
    refetchQueries: [ReadChangesDocument],
  });

  const onDelete = useCallback(async () => {
    await deleteChange({
      variables: {
        where: { id: change?.id },
      },
    });
  }, [deleteChange, change]);

  return (
    <DeleteDialog title="Delete Change" icon={icon} open={open} setOpen={setOpen} onDelete={onDelete}>
      <p>{`Are you sure you want to delete the change for ${change?.mutation} ${change?.table}?`}</p>
    </DeleteDialog>
  );
}
