"use client";

import { FormGroup, InputGroup } from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import { IconName } from "@blueprintjs/icons";
import {
  ReadSetpointsDocument,
  ReadSetpointsQuery,
  DeleteSetpointDocument,
  CreateSetpointDocument,
  UpdateSetpointDocument,
} from "@/graphql-codegen/graphql";
import { useMutation } from "@apollo/client";
import { Term } from "@/utils/client";
import { CreateDialog, DeleteDialog, UpdateDialog } from "../dialog";

export function CreateSetpoint({
  open,
  setOpen,
  icon,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
}) {
  const [label, setLabel] = useState("");
  const [setpoint, setSetpoint] = useState("");
  const [deadband, setDeadband] = useState("");
  const [heating, setHeating] = useState("");
  const [cooling, setCooling] = useState("");
  const [stage, setStage] = useState("");
  const [correlation, setCorrelation] = useState("");
  const [message, setMessage] = useState("");

  const [createSetpoint] = useMutation(CreateSetpointDocument, {
    refetchQueries: [ReadSetpointsDocument],
  });

  const onCreate = useCallback(async () => {
    await createSetpoint({
      variables: {
        create: {
          label,
          ...(setpoint && { setpoint: parseFloat(setpoint) }),
          ...(deadband && { deadband: parseFloat(deadband) }),
          ...(heating && { heating: parseFloat(heating) }),
          ...(cooling && { cooling: parseFloat(cooling) }),
          ...(correlation && { correlation }),
          ...(message && { message }),
        },
      },
    });
  }, [createSetpoint, label, setpoint, deadband, heating, cooling, correlation, message]);

  useEffect(() => {
    setLabel("");
    setSetpoint("");
    setDeadband("");
    setHeating("");
    setCooling("");
    setStage("");
    setCorrelation("");
    setMessage("");
  }, [open]);

  return (
    <CreateDialog title="Create Setpoint" icon={icon} open={open} setOpen={setOpen} onCreate={onCreate}>
      <FormGroup label="Label">
        <InputGroup id="label" name="label" value={label} onChange={(event) => setLabel(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Setpoint">
        <InputGroup
          id="setpoint"
          name="setpoint"
          type="number"
          step="0.1"
          value={setpoint}
          onChange={(event) => setSetpoint(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Deadband">
        <InputGroup
          id="deadband"
          name="deadband"
          type="number"
          step="0.1"
          value={deadband}
          onChange={(event) => setDeadband(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Heating">
        <InputGroup
          id="heating"
          name="heating"
          type="number"
          step="0.1"
          value={heating}
          onChange={(event) => setHeating(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Cooling">
        <InputGroup
          id="cooling"
          name="cooling"
          type="number"
          step="0.1"
          value={cooling}
          onChange={(event) => setCooling(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Stage">
        <InputGroup
          id="stage"
          name="stage"
          value={stage}
          onChange={(event) => setStage(event.target.value)}
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

export function UpdateSetpoint({
  open,
  setOpen,
  icon,
  setpoint: setpointData,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  setpoint?: Term<NonNullable<ReadSetpointsQuery["readSetpoints"]>[0]>;
}) {
  const [label, setLabel] = useState("");
  const [setpoint, setSetpoint] = useState("");
  const [deadband, setDeadband] = useState("");
  const [heating, setHeating] = useState("");
  const [cooling, setCooling] = useState("");
  const [stage, setStage] = useState("");
  const [correlation, setCorrelation] = useState("");
  const [message, setMessage] = useState("");

  const [updateSetpoint] = useMutation(UpdateSetpointDocument, {
    refetchQueries: [ReadSetpointsDocument],
  });

  const onUpdate = useCallback(async () => {
    await updateSetpoint({
      variables: {
        where: { id: setpointData?.id },
        update: {
          ...(label !== setpointData?.label && { label }),
          ...(setpoint !== (setpointData?.setpoint?.toString() ?? "") && setpoint && { setpoint: parseFloat(setpoint) }),
          ...(deadband !== (setpointData?.deadband?.toString() ?? "") && deadband && { deadband: parseFloat(deadband) }),
          ...(heating !== (setpointData?.heating?.toString() ?? "") && heating && { heating: parseFloat(heating) }),
          ...(cooling !== (setpointData?.cooling?.toString() ?? "") && cooling && { cooling: parseFloat(cooling) }),
          ...(correlation !== setpointData?.correlation && { correlation }),
          ...(message !== setpointData?.message && { message }),
        },
      },
    });
  }, [updateSetpoint, setpointData, label, setpoint, deadband, heating, cooling, correlation, message]);

  useEffect(() => {
    setLabel(setpointData?.label ?? "");
    setSetpoint(setpointData?.setpoint?.toString() ?? "");
    setDeadband(setpointData?.deadband?.toString() ?? "");
    setHeating(setpointData?.heating?.toString() ?? "");
    setCooling(setpointData?.cooling?.toString() ?? "");
    setStage(setpointData?.stage ?? "");
    setCorrelation(setpointData?.correlation ?? "");
    setMessage(setpointData?.message ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <UpdateDialog title="Update Setpoint" icon={icon} open={open} setOpen={setOpen} onUpdate={onUpdate}>
      <FormGroup label="Label">
        <InputGroup id="label" name="label" value={label} onChange={(event) => setLabel(event.target.value)} fill />
      </FormGroup>
      <FormGroup label="Setpoint">
        <InputGroup
          id="setpoint"
          name="setpoint"
          type="number"
          step="0.1"
          value={setpoint}
          onChange={(event) => setSetpoint(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Deadband">
        <InputGroup
          id="deadband"
          name="deadband"
          type="number"
          step="0.1"
          value={deadband}
          onChange={(event) => setDeadband(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Heating">
        <InputGroup
          id="heating"
          name="heating"
          type="number"
          step="0.1"
          value={heating}
          onChange={(event) => setHeating(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Cooling">
        <InputGroup
          id="cooling"
          name="cooling"
          type="number"
          step="0.1"
          value={cooling}
          onChange={(event) => setCooling(event.target.value)}
          fill
        />
      </FormGroup>
      <FormGroup label="Stage">
        <InputGroup
          id="stage"
          name="stage"
          value={stage}
          onChange={(event) => setStage(event.target.value)}
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

export function DeleteSetpoint({
  open,
  setOpen,
  icon,
  setpoint,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  setpoint?: Term<NonNullable<ReadSetpointsQuery["readSetpoints"]>[0]>;
}) {
  const [deleteSetpoint] = useMutation(DeleteSetpointDocument, {
    refetchQueries: [ReadSetpointsDocument],
  });

  const onDelete = useCallback(async () => {
    await deleteSetpoint({
      variables: {
        where: { id: setpoint?.id },
      },
    });
  }, [deleteSetpoint, setpoint]);

  return (
    <DeleteDialog title="Delete Setpoint" icon={icon} open={open} setOpen={setOpen} onDelete={onDelete}>
      <p>{`Are you sure you want to delete the setpoint '${setpoint?.label}'?`}</p>
    </DeleteDialog>
  );
}
