"use client";

import { FormGroup, InputGroup, HTMLSelect, NumericInput } from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import { IconName } from "@blueprintjs/icons";
import {
  ReadHolidaysDocument,
  ReadHolidaysQuery,
  DeleteHolidayDocument,
  CreateHolidayDocument,
  UpdateHolidayDocument,
} from "@/graphql-codegen/graphql";
import { useMutation } from "@apollo/client";
import { Term } from "@/utils/client";
import { CreateDialog, DeleteDialog, UpdateDialog } from "../dialog";

export function CreateHoliday({
  open,
  setOpen,
  icon,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
}) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState("Enabled");

  const [createHoliday] = useMutation(CreateHolidayDocument, {
    refetchQueries: [ReadHolidaysDocument],
  });

  const onCreate = useCallback(async () => {
    await createHoliday({
      variables: {
        create: {
          label,
          type: type as any,
        },
      },
    });
  }, [createHoliday, label, type]);

  useEffect(() => {
    if (open) {
      setLabel("");
      setType("Enabled");
    }
  }, [open]);

  return (
    <CreateDialog title="Create Holiday" icon={icon} open={open} setOpen={setOpen} onCreate={onCreate}>
      <FormGroup label="Label">
        <InputGroup id="label" name="label" value={label} onChange={(event) => setLabel(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Type">
        <HTMLSelect value={type} onChange={(e) => setType(e.target.value)} fill>
          <option value="Enabled">Enabled</option>
          <option value="Disabled">Disabled</option>
          <option value="Custom">Custom</option>
        </HTMLSelect>
      </FormGroup>
    </CreateDialog>
  );
}

export function UpdateHoliday({
  open,
  setOpen,
  icon,
  holiday: holidayData,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  holiday?: Term<NonNullable<ReadHolidaysQuery["readHolidays"]>[0]>;
}) {
  const [label, setLabel] = useState("");

  const [updateHoliday] = useMutation(UpdateHolidayDocument, {
    refetchQueries: [ReadHolidaysDocument],
  });

  const onUpdate = useCallback(async () => {
    const updateData: any = {};

    if (label !== holidayData?.label) updateData.label = label;

    await updateHoliday({
      variables: {
        where: { id: holidayData?.id },
        update: updateData,
      },
    });
  }, [updateHoliday, holidayData, label]);

  useEffect(() => {
    if (open && holidayData) {
      setLabel(holidayData.label ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <UpdateDialog title="Update Holiday" icon={icon} open={open} setOpen={setOpen} onUpdate={onUpdate}>
      <FormGroup label="Label">
        <InputGroup id="label" name="label" value={label} onChange={(event) => setLabel(event.target.value)} fill />
      </FormGroup>
    </UpdateDialog>
  );
}

export function DeleteHoliday({
  open,
  setOpen,
  icon,
  holiday,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  holiday?: Term<NonNullable<ReadHolidaysQuery["readHolidays"]>[0]>;
}) {
  const [deleteHoliday] = useMutation(DeleteHolidayDocument, {
    refetchQueries: [ReadHolidaysDocument],
  });

  const onDelete = useCallback(async () => {
    await deleteHoliday({
      variables: {
        where: { id: holiday?.id },
      },
    });
  }, [deleteHoliday, holiday]);

  return (
    <DeleteDialog title="Delete Holiday" icon={icon} open={open} setOpen={setOpen} onDelete={onDelete}>
      <p>{`Are you sure you want to delete the holiday '${holiday?.label}'?`}</p>
    </DeleteDialog>
  );
}
