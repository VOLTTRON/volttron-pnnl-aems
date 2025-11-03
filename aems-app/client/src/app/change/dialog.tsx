"use client";

import { Card, FormGroup, InputGroup } from "@blueprintjs/core";
import React, { useContext } from "react";
import { IconName } from "@blueprintjs/icons";
import { ReadChangesQuery } from "@/graphql-codegen/graphql";
import { Term } from "@/utils/client";
import { ViewDialog } from "../dialog";
import { JsonView, allExpanded, darkStyles, defaultStyles } from "react-json-view-lite";
import { compilePreferences, CurrentContext, PreferencesContext } from "../components/providers";
import "react-json-view-lite/dist/index.css";

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
  change?: Term<NonNullable<ReadChangesQuery["readChanges"]>[0]>;
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
