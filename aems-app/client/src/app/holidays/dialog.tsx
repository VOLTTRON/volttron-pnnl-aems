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
  const [day, setDay] = useState<number | undefined>();
  const [month, setMonth] = useState<number | undefined>();
  const [observance, setObservance] = useState("");
  const [type, setType] = useState("Enabled");
  const [correlation, setCorrelation] = useState("");
  const [message, setMessage] = useState("");

  const [createHoliday] = useMutation(CreateHolidayDocument, {
    refetchQueries: [ReadHolidaysDocument],
  });

  const onCreate = useCallback(async () => {
    await createHoliday({
      variables: {
        create: {
          label,
          type: type as any,
          ...(day !== undefined && { day }),
          ...(month !== undefined && { month }),
          ...(observance && { observance }),
          ...(correlation && { correlation }),
          ...(message && { message }),
        },
      },
    });
  }, [createHoliday, label, day, month, observance, type, correlation, message]);

  useEffect(() => {
    if (open) {
      setLabel("");
      setDay(undefined);
      setMonth(undefined);
      setObservance("");
      setType("Enabled");
      setCorrelation("");
      setMessage("");
    }
  }, [open]);

  return (
    <CreateDialog title="Create Holiday" icon={icon} open={open} setOpen={setOpen} onCreate={onCreate}>
      <FormGroup label="Label">
        <InputGroup id="label" name="label" value={label} onChange={(event) => setLabel(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Month">
        <NumericInput
          value={month}
          onValueChange={setMonth}
          min={1}
          max={12}
          stepSize={1}
          placeholder="1-12"
          fill
        />
      </FormGroup>
      <FormGroup label="Day">
        <NumericInput
          value={day}
          onValueChange={setDay}
          min={1}
          max={31}
          stepSize={1}
          placeholder="1-31"
          fill
        />
      </FormGroup>
      <FormGroup label="Type">
        <HTMLSelect value={type} onChange={(e) => setType(e.target.value)} fill>
          <option value="Enabled">Enabled</option>
          <option value="Disabled">Disabled</option>
          <option value="Custom">Custom</option>
        </HTMLSelect>
      </FormGroup>
      <FormGroup label="Observance">
        <InputGroup
          id="observance"
          name="observance"
          value={observance}
          onChange={(event) => setObservance(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Correlation">
        <InputGroup
          id="correlation"
          name="correlation"
          value={correlation}
          onChange={(event) => setCorrelation(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Message">
        <InputGroup
          id="message"
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          fill
        />
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
  const [day, setDay] = useState<number | undefined>();
  const [month, setMonth] = useState<number | undefined>();
  const [observance, setObservance] = useState("");
  const [type, setType] = useState("Enabled");
  const [correlation, setCorrelation] = useState("");
  const [message, setMessage] = useState("");

  const [updateHoliday] = useMutation(UpdateHolidayDocument, {
    refetchQueries: [ReadHolidaysDocument],
  });

  const onUpdate = useCallback(async () => {
    const updateData: any = {};
    
    if (label !== holidayData?.label) updateData.label = label;
    if (day !== holidayData?.day) updateData.day = day;
    if (month !== holidayData?.month) updateData.month = month;
    if (observance !== holidayData?.observance) updateData.observance = observance;
    if (type !== holidayData?.type) updateData.type = type;
    if (correlation !== holidayData?.correlation) updateData.correlation = correlation;
    if (message !== holidayData?.message) updateData.message = message;

    await updateHoliday({
      variables: {
        where: { id: holidayData?.id },
        update: updateData,
      },
    });
  }, [updateHoliday, holidayData, label, day, month, observance, type, correlation, message]);

  useEffect(() => {
    if (open && holidayData) {
      setLabel(holidayData.label ?? "");
      setDay(holidayData.day ?? undefined);
      setMonth(holidayData.month ?? undefined);
      setObservance(holidayData.observance ?? "");
      setType(holidayData.type ?? "Enabled");
      setCorrelation(holidayData.correlation ?? "");
      setMessage(holidayData.message ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <UpdateDialog title="Update Holiday" icon={icon} open={open} setOpen={setOpen} onUpdate={onUpdate}>
      <FormGroup label="Label">
        <InputGroup id="label" name="label" value={label} onChange={(event) => setLabel(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Month">
        <NumericInput
          value={month}
          onValueChange={setMonth}
          min={1}
          max={12}
          stepSize={1}
          placeholder="1-12"
          fill
        />
      </FormGroup>
      <FormGroup label="Day">
        <NumericInput
          value={day}
          onValueChange={setDay}
          min={1}
          max={31}
          stepSize={1}
          placeholder="1-31"
          fill
        />
      </FormGroup>
      <FormGroup label="Type">
        <HTMLSelect value={type} onChange={(e) => setType(e.target.value)} fill>
          <option value="Enabled">Enabled</option>
          <option value="Disabled">Disabled</option>
          <option value="Custom">Custom</option>
        </HTMLSelect>
      </FormGroup>
      <FormGroup label="Observance">
        <InputGroup
          id="observance"
          name="observance"
          value={observance}
          onChange={(event) => setObservance(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Correlation">
        <InputGroup
          id="correlation"
          name="correlation"
          value={correlation}
          onChange={(event) => setCorrelation(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Message">
        <InputGroup
          id="message"
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          fill
        />
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
