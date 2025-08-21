"use client";

import {
  Button,
  Classes,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  InputGroup,
  Intent,
} from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
import { useMutation } from "@apollo/client";
import { useContext, useEffect, useState } from "react";
import {
  CreateControlDocument,
  UpdateControlDocument,
  DeleteControlDocument,
  ReadControlsDocument,
  ReadControlsQuery,
} from "@/graphql-codegen/graphql";
import { NotificationContext, NotificationType } from "../components/providers";
import { Term } from "@/utils/client";

interface BaseDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
}

interface CreateControlProps extends BaseDialogProps {}

interface UpdateControlProps extends BaseDialogProps {
  control?: Term<NonNullable<ReadControlsQuery["readControls"]>[0]>;
}

interface DeleteControlProps extends BaseDialogProps {
  control?: Term<NonNullable<ReadControlsQuery["readControls"]>[0]>;
}

export function CreateControl({ open, setOpen, icon }: CreateControlProps) {
  const [label, setLabel] = useState("");
  const [building, setBuilding] = useState("");
  const [correlation, setCorrelation] = useState("");

  const { createNotification } = useContext(NotificationContext);

  const [createControl, { loading }] = useMutation(CreateControlDocument, {
    refetchQueries: [{ query: ReadControlsDocument }],
    onCompleted() {
      createNotification?.("Control created successfully", NotificationType.Notification);
      setOpen(false);
      setLabel("");
      setBuilding("");
      setCorrelation("");
    },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const handleSubmit = () => {
    if (!label.trim()) {
      createNotification?.("Label is required", NotificationType.Error);
      return;
    }

    createControl({
      variables: {
        create: {
          label: label.trim(),
          name: label.trim(), // Required field - using label as name
          building: building.trim() || undefined,
          correlation: correlation.trim() || undefined,
        },
      },
    });
  };

  useEffect(() => {
    if (!open) {
      setLabel("");
      setBuilding("");
      setCorrelation("");
    }
  }, [open]);

  return (
    <Dialog isOpen={open} onClose={() => setOpen(false)} title="Create Control" icon={icon}>
      <DialogBody>
        <FormGroup label="Label" labelFor="label" labelInfo="(required)">
          <InputGroup
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Enter control label"
          />
        </FormGroup>
        <FormGroup label="Building" labelFor="building">
          <InputGroup
            id="building"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            placeholder="Enter building name"
          />
        </FormGroup>
        <FormGroup label="Correlation" labelFor="correlation">
          <InputGroup
            id="correlation"
            value={correlation}
            onChange={(e) => setCorrelation(e.target.value)}
            placeholder="Enter correlation ID"
          />
        </FormGroup>
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button intent={Intent.PRIMARY} loading={loading} onClick={handleSubmit}>
              Create
            </Button>
          </>
        }
      />
    </Dialog>
  );
}

export function UpdateControl({ open, setOpen, icon, control }: UpdateControlProps) {
  const [label, setLabel] = useState("");
  const [building, setBuilding] = useState("");
  const [correlation, setCorrelation] = useState("");

  const { createNotification } = useContext(NotificationContext);

  const [updateControl, { loading }] = useMutation(UpdateControlDocument, {
    refetchQueries: [{ query: ReadControlsDocument }],
    onCompleted() {
      createNotification?.("Control updated successfully", NotificationType.Notification);
      setOpen(false);
    },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const handleSubmit = () => {
    if (!control?.id) return;
    if (!label.trim()) {
      createNotification?.("Label is required", NotificationType.Error);
      return;
    }

    updateControl({
      variables: {
        where: { id: control.id },
        update: {
          label: label.trim(),
          building: building.trim() || undefined,
          correlation: correlation.trim() || undefined,
        },
      },
    });
  };

  useEffect(() => {
    if (open && control) {
      setLabel(control.label || "");
      setBuilding(""); // Building property not available in GraphQL type
      setCorrelation(control.correlation || "");
    }
  }, [open, control]);

  return (
    <Dialog isOpen={open} onClose={() => setOpen(false)} title="Update Control" icon={icon}>
      <DialogBody>
        <FormGroup label="Label" labelFor="label" labelInfo="(required)">
          <InputGroup
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Enter control label"
          />
        </FormGroup>
        <FormGroup label="Building" labelFor="building">
          <InputGroup
            id="building"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            placeholder="Enter building name"
          />
        </FormGroup>
        <FormGroup label="Correlation" labelFor="correlation">
          <InputGroup
            id="correlation"
            value={correlation}
            onChange={(e) => setCorrelation(e.target.value)}
            placeholder="Enter correlation ID"
          />
        </FormGroup>
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button intent={Intent.PRIMARY} loading={loading} onClick={handleSubmit}>
              Update
            </Button>
          </>
        }
      />
    </Dialog>
  );
}

export function DeleteControl({ open, setOpen, icon, control }: DeleteControlProps) {
  const { createNotification } = useContext(NotificationContext);

  const [deleteControl, { loading }] = useMutation(DeleteControlDocument, {
    refetchQueries: [{ query: ReadControlsDocument }],
    onCompleted() {
      createNotification?.("Control deleted successfully", NotificationType.Notification);
      setOpen(false);
    },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const handleSubmit = () => {
    if (!control?.id) return;

    deleteControl({
      variables: {
        where: { id: control.id },
      },
    });
  };

  return (
    <Dialog isOpen={open} onClose={() => setOpen(false)} title="Delete Control" icon={icon}>
      <DialogBody>
        <p>
          Are you sure you want to delete the control <strong>{control?.label}</strong>? This action cannot be undone.
        </p>
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button intent={Intent.DANGER} loading={loading} onClick={handleSubmit}>
              Delete
            </Button>
          </>
        }
      />
    </Dialog>
  );
}
