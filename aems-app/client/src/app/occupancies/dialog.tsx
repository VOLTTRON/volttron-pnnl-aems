"use client";

import { FormGroup, InputGroup, TextArea } from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import { IconName } from "@blueprintjs/icons";
import {
  ReadOccupanciesDocument,
  ReadOccupanciesQuery,
  DeleteOccupancyDocument,
  CreateOccupancyDocument,
  UpdateOccupancyDocument,
} from "@/graphql-codegen/graphql";
import { useMutation } from "@apollo/client";
import { CreateDialog, DeleteDialog, UpdateDialog } from "../dialog";

export function CreateOccupancy({
  open,
  setOpen,
  icon,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
}) {
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");

  const [createOccupancy] = useMutation(CreateOccupancyDocument, {
    refetchQueries: [ReadOccupanciesDocument],
  });

  const onCreate = useCallback(async () => {
    if (!label || !date) {
      return;
    }

    await createOccupancy({
      variables: {
        create: {
          label,
          date: new Date(date).toISOString(),
        },
      },
    });
  }, [createOccupancy, label, date]);

  useEffect(() => {
    if (open) {
      setLabel("");
      setDate("");
    }
  }, [open]);

  return (
    <CreateDialog title="Create Occupancy" icon={icon} open={open} setOpen={setOpen} onCreate={onCreate}>
      <FormGroup label="Label" labelInfo="(required)">
        <InputGroup id="label" name="label" value={label} onChange={(event) => setLabel(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Date" labelInfo="(required)">
        <InputGroup id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} fill />
      </FormGroup>
    </CreateDialog>
  );
}

export function UpdateOccupancy({
  open,
  setOpen,
  icon,
  occupancy: occupancyData,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  occupancy?: NonNullable<ReadOccupanciesQuery["readOccupancies"]>[0];
}) {
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");

  const [updateOccupancy] = useMutation(UpdateOccupancyDocument, {
    refetchQueries: [ReadOccupanciesDocument],
  });

  const onUpdate = useCallback(async () => {
    if (!occupancyData?.id) {
      return;
    }

    const updateData: any = {};

    if (label !== occupancyData?.label) updateData.label = label;
    if (date && new Date(date).toISOString() !== occupancyData?.date) updateData.date = new Date(date).toISOString();

    await updateOccupancy({
      variables: {
        where: { id: occupancyData.id },
        update: updateData,
      },
    });
  }, [updateOccupancy, occupancyData, label, date]);

  useEffect(() => {
    if (open && occupancyData) {
      setLabel(occupancyData.label ?? "");
      setDate(occupancyData.date ? new Date(occupancyData.date).toISOString().split("T")[0] : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <UpdateDialog title="Update Occupancy" icon={icon} open={open} setOpen={setOpen} onUpdate={onUpdate}>
      <FormGroup label="Label" labelInfo="(required)">
        <InputGroup id="label" name="label" value={label} onChange={(event) => setLabel(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Date" labelInfo="(required)">
        <InputGroup id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} fill />
      </FormGroup>
    </UpdateDialog>
  );
}

export function DeleteOccupancy({
  open,
  setOpen,
  icon,
  occupancy,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  occupancy?: NonNullable<ReadOccupanciesQuery["readOccupancies"]>[0];
}) {
  const [deleteOccupancy] = useMutation(DeleteOccupancyDocument, {
    refetchQueries: [ReadOccupanciesDocument],
  });

  const onDelete = useCallback(async () => {
    if (!occupancy?.id) {
      return;
    }

    await deleteOccupancy({
      variables: {
        where: { id: occupancy.id },
      },
    });
  }, [deleteOccupancy, occupancy]);

  return (
    <DeleteDialog title="Delete Occupancy" icon={icon} open={open} setOpen={setOpen} onDelete={onDelete}>
      <p>{`Are you sure you want to delete the occupancy '${occupancy?.label}'?`}</p>
    </DeleteDialog>
  );
}
