"use client";

import { FormGroup, InputGroup } from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import { IconName } from "@blueprintjs/icons";
import {
  ReadConfigurationsDocument,
  ReadConfigurationsQuery,
  DeleteConfigurationDocument,
  CreateConfigurationDocument,
  UpdateConfigurationDocument,
} from "@/graphql-codegen/graphql";
import { useMutation } from "@apollo/client";
import { Term } from "@/utils/client";
import { CreateDialog, DeleteDialog, UpdateDialog } from "../dialog";

export function CreateConfiguration({
  open,
  setOpen,
  icon,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
}) {
  const [label, setLabel] = useState("");
  const [correlation, setCorrelation] = useState("");
  const [message, setMessage] = useState("");

  const [createConfiguration] = useMutation(CreateConfigurationDocument, {
    refetchQueries: [ReadConfigurationsDocument],
  });

  const onCreate = useCallback(async () => {
    await createConfiguration({
      variables: {
        create: {
          label,
          ...(correlation && { correlation }),
          ...(message && { message }),
        },
      },
    });
  }, [createConfiguration, label, correlation, message]);

  useEffect(() => {
    setLabel("");
    setCorrelation("");
    setMessage("");
  }, [open]);

  return (
    <CreateDialog title="Create Configuration" icon={icon} open={open} setOpen={setOpen} onCreate={onCreate}>
      <FormGroup label="Label">
        <InputGroup id="label" name="label" value={label} onChange={(event) => setLabel(event.target.value)} fill />
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

export function UpdateConfiguration({
  open,
  setOpen,
  icon,
  configuration: configurationData,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  configuration?: Term<NonNullable<ReadConfigurationsQuery["readConfigurations"]>[0]>;
}) {
  const [label, setLabel] = useState("");
  const [correlation, setCorrelation] = useState("");
  const [message, setMessage] = useState("");

  const [updateConfiguration] = useMutation(UpdateConfigurationDocument, {
    refetchQueries: [ReadConfigurationsDocument],
  });

  const onUpdate = useCallback(async () => {
    await updateConfiguration({
      variables: {
        where: { id: configurationData?.id },
        update: {
          ...(label !== configurationData?.label && { label }),
          ...(correlation !== configurationData?.correlation && { correlation }),
          ...(message !== configurationData?.message && { message }),
        },
      },
    });
  }, [updateConfiguration, configurationData, label, correlation, message]);

  useEffect(() => {
    setLabel(configurationData?.label ?? "");
    setCorrelation(configurationData?.correlation ?? "");
    setMessage(configurationData?.message ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <UpdateDialog title="Update Configuration" icon={icon} open={open} setOpen={setOpen} onUpdate={onUpdate}>
      <FormGroup label="Label">
        <InputGroup id="label" name="label" value={label} onChange={(event) => setLabel(event.target.value)} fill />
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

export function DeleteConfiguration({
  open,
  setOpen,
  icon,
  configuration,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  configuration?: Term<NonNullable<ReadConfigurationsQuery["readConfigurations"]>[0]>;
}) {
  const [deleteConfiguration] = useMutation(DeleteConfigurationDocument, {
    refetchQueries: [ReadConfigurationsDocument],
  });

  const onDelete = useCallback(async () => {
    await deleteConfiguration({
      variables: {
        where: { id: configuration?.id },
      },
    });
  }, [deleteConfiguration, configuration]);

  return (
    <DeleteDialog title="Delete Configuration" icon={icon} open={open} setOpen={setOpen} onDelete={onDelete}>
      <p>{`Are you sure you want to delete the configuration '${configuration?.label}'?`}</p>
    </DeleteDialog>
  );
}
