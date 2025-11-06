"use client";

import { FormGroup, InputGroup, TextArea, Switch } from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import { IconName } from "@blueprintjs/icons";
import {
  ReadSchedulesDocument,
  ReadSchedulesQuery,
  DeleteScheduleDocument,
  CreateScheduleDocument,
  UpdateScheduleDocument,
} from "@/graphql-codegen/graphql";
import { useMutation } from "@apollo/client";
import { CreateDialog, DeleteDialog, UpdateDialog } from "../dialog";

export function CreateSchedule({
  open,
  setOpen,
  icon,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
}) {
  const [label, setLabel] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [occupied, setOccupied] = useState(false);

  const [createSchedule] = useMutation(CreateScheduleDocument, {
    refetchQueries: [ReadSchedulesDocument],
  });

  const onCreate = useCallback(async () => {
    if (!label) {
      return;
    }

    await createSchedule({
      variables: {
        create: {
          label,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          occupied,
        },
      },
    });
  }, [createSchedule, label, startTime, endTime, occupied]);

  useEffect(() => {
    if (open) {
      setLabel("");
      setStartTime("");
      setEndTime("");
      setOccupied(false);
    }
  }, [open]);

  return (
    <CreateDialog title="Create Schedule" icon={icon} open={open} setOpen={setOpen} onCreate={onCreate}>
      <FormGroup label="Label" labelInfo="(required)">
        <InputGroup id="label" name="label" value={label} onChange={(event) => setLabel(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Start Time">
        <InputGroup
          id="startTime"
          type="time"
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="End Time">
        <InputGroup
          id="endTime"
          type="time"
          value={endTime}
          onChange={(event) => setEndTime(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Occupied">
        <Switch id="occupied" checked={occupied} onChange={(event) => setOccupied(event.currentTarget.checked)} />
      </FormGroup>
    </CreateDialog>
  );
}

export function UpdateSchedule({
  open,
  setOpen,
  icon,
  schedule: scheduleData,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  schedule?: NonNullable<ReadSchedulesQuery["readSchedules"]>[0];
}) {
  const [label, setLabel] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [occupied, setOccupied] = useState(false);

  const [updateSchedule] = useMutation(UpdateScheduleDocument, {
    refetchQueries: [ReadSchedulesDocument],
  });

  const onUpdate = useCallback(async () => {
    if (!scheduleData?.id) {
      return;
    }

    const updateData: any = {};

    if (label !== scheduleData?.label) updateData.label = label;
    if (startTime !== scheduleData?.startTime) updateData.startTime = startTime;
    if (endTime !== scheduleData?.endTime) updateData.endTime = endTime;
    if (occupied !== scheduleData?.occupied) updateData.occupied = occupied;

    await updateSchedule({
      variables: {
        where: { id: scheduleData.id },
        update: updateData,
      },
    });
  }, [updateSchedule, scheduleData, label, startTime, endTime, occupied]);

  useEffect(() => {
    if (open && scheduleData) {
      setLabel(scheduleData.label ?? "");
      setStartTime(scheduleData.startTime ?? "");
      setEndTime(scheduleData.endTime ?? "");
      setOccupied(scheduleData.occupied ?? false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <UpdateDialog title="Update Schedule" icon={icon} open={open} setOpen={setOpen} onUpdate={onUpdate}>
      <FormGroup label="Label" labelInfo="(required)">
        <InputGroup id="label" name="label" value={label} onChange={(event) => setLabel(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Start Time">
        <InputGroup
          id="startTime"
          type="time"
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="End Time">
        <InputGroup
          id="endTime"
          type="time"
          value={endTime}
          onChange={(event) => setEndTime(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Occupied">
        <Switch id="occupied" checked={occupied} onChange={(event) => setOccupied(event.currentTarget.checked)} />
      </FormGroup>
    </UpdateDialog>
  );
}

export function DeleteSchedule({
  open,
  setOpen,
  icon,
  schedule,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  schedule?: NonNullable<ReadSchedulesQuery["readSchedules"]>[0];
}) {
  const [deleteSchedule] = useMutation(DeleteScheduleDocument, {
    refetchQueries: [ReadSchedulesDocument],
  });

  const onDelete = useCallback(async () => {
    if (!schedule?.id) {
      return;
    }

    await deleteSchedule({
      variables: {
        where: { id: schedule.id },
      },
    });
  }, [deleteSchedule, schedule]);

  return (
    <DeleteDialog title="Delete Schedule" icon={icon} open={open} setOpen={setOpen} onDelete={onDelete}>
      <p>{`Are you sure you want to delete the schedule '${schedule?.label}'?`}</p>
    </DeleteDialog>
  );
}
