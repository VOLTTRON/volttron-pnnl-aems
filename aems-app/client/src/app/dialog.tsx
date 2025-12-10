"use client";

import { Button, Callout, Dialog, DialogBody, DialogFooter, Intent } from "@blueprintjs/core";
import React, { useContext, useEffect, useState } from "react";
import { IconName, IconNames } from "@blueprintjs/icons";
import { LoadingContext, LoadingType } from "./components/providers";
import { DialogType } from "./types";

export function CreateDialog({
  open,
  setOpen,
  title,
  icon,
  accept,
  onCreate,
  disabled,
  children,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  icon?: IconName;
  accept?: {
    text?: string;
    icon?: IconName;
    intent?: Intent;
  };
  onCreate: () => Promise<void>;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const [error, setError] = useState("");

  const { createLoading, clearLoading } = useContext(LoadingContext);

  useEffect(() => {
    setError("");
  }, [open]);

  return (
    <Dialog title={title} icon={icon} isOpen={open} onClose={() => setOpen(false)}>
      <DialogBody>
        {children}
        {error && <Callout intent={Intent.DANGER}>{error}</Callout>}
      </DialogBody>
      <DialogFooter>
        <Button
          icon={accept?.icon ?? IconNames.CONFIRM}
          intent={accept?.intent ?? Intent.PRIMARY}
          onClick={async () => {
            const token = createLoading?.(LoadingType.GLOBAL);
            try {
              await onCreate()
                .then(() => {
                  setOpen(false);
                })
                .catch((error) => {
                  setError(error.message);
                })
                .finally(() => {
                  token && clearLoading?.(token);
                });
            } catch (e: any) {
              console.error("Uncaught exception from CreateDialog.onCreate(): ", e);
              setError("Create failed: " + e.message);
              token && clearLoading?.(token);
            }
          }}
          disabled={disabled}
        >
          {accept?.text ?? "Create"}
        </Button>
        <Button icon={IconNames.CROSS} intent={Intent.NONE} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export function ReadDialog({
  open,
  setOpen,
  title,
  icon,
  children,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  icon?: IconName;
  children?: React.ReactNode;
}) {
  return (
    <Dialog title={title} icon={icon} isOpen={open} onClose={() => setOpen(false)}>
      <DialogBody>{children}</DialogBody>
      <DialogFooter>
        <Button icon={IconNames.CROSS} intent={Intent.NONE} onClick={() => setOpen(false)}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export function UpdateDialog({
  open,
  setOpen,
  title,
  icon,
  accept,
  onUpdate,
  disabled,
  children,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  icon?: IconName;
  accept?: {
    text?: string;
    icon?: IconName;
    intent?: Intent;
  };
  onUpdate: () => Promise<void>;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const [error, setError] = useState("");

  const { createLoading, clearLoading } = useContext(LoadingContext);

  useEffect(() => {
    setError("");
  }, [open]);

  return (
    <Dialog title={title} icon={icon} isOpen={open} onClose={() => setOpen(false)}>
      <DialogBody>
        {children}
        {error && <Callout intent={Intent.DANGER}>{error}</Callout>}
      </DialogBody>
      <DialogFooter>
        <Button
          icon={accept?.icon ?? IconNames.CONFIRM}
          intent={accept?.intent ?? Intent.PRIMARY}
          onClick={async () => {
            const token = createLoading?.(LoadingType.GLOBAL);
            try {
              await onUpdate()
                .then(() => {
                  setOpen(false);
                })
                .catch((error) => {
                  setError(error);
                })
                .finally(() => {
                  token && clearLoading?.(token);
                });
            } catch (e: any) {
              console.error("Uncaught exception from UpdateDialog.onUpdate(): ", e);
              setError("Create failed: " + e.message);
              token && clearLoading?.(token);
            }
          }}
          disabled={disabled}
        >
          {accept?.text ?? "Update"}
        </Button>
        <Button icon={IconNames.CROSS} intent={Intent.NONE} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export function DeleteDialog({
  open,
  setOpen,
  title,
  icon,
  accept,
  onDelete,
  disabled,
  children,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  icon?: IconName;
  accept?: {
    text?: string;
    icon?: IconName;
    intent?: Intent;
  };
  onDelete: () => Promise<void>;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const [error, setError] = useState("");

  const { createLoading, clearLoading } = useContext(LoadingContext);

  useEffect(() => {
    setError("");
  }, [open]);

  return (
    <Dialog title={title} icon={icon} isOpen={open} onClose={() => setOpen(false)}>
      <DialogBody>
        {children}
        {error && <Callout intent={Intent.DANGER}>{error}</Callout>}
      </DialogBody>
      <DialogFooter>
        <Button
          icon={accept?.icon ?? IconNames.TRASH}
          intent={accept?.intent ?? Intent.DANGER}
          onClick={async () => {
            const token = createLoading?.(LoadingType.GLOBAL);
            try {
              await onDelete()
                .then(() => {
                  setOpen(false);
                })
                .catch((error) => {
                  setError(error.message);
                })
                .finally(() => {
                  token && clearLoading?.(token);
                });
            } catch (e: any) {
              console.error("Uncaught exception from DeleteDialog.onDelete(): ", e);
              setError("Delete failed: " + e.message);
              token && clearLoading?.(token);
            }
          }}
          disabled={disabled}
        >
          {accept?.text ?? "Delete"}
        </Button>
        <Button icon={IconNames.CROSS} intent={Intent.NONE} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export function ConfirmDialog({
  open,
  setOpen,
  title,
  icon,
  accept,
  onConfirm,
  disabled,
  children,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  icon?: IconName;
  accept?: {
    text?: string;
    icon?: IconName;
    intent?: Intent;
  };
  onConfirm: () => Promise<void>;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const [error, setError] = useState("");

  const { createLoading, clearLoading } = useContext(LoadingContext);

  useEffect(() => {
    setError("");
  }, [open]);

  return (
    <Dialog title={title} icon={icon} isOpen={open} onClose={() => setOpen(false)}>
      <DialogBody>
        {children}
        {error && <Callout intent={Intent.DANGER}>{error}</Callout>}
      </DialogBody>
      <DialogFooter>
        <Button
          icon={accept?.icon ?? IconNames.CONFIRM}
          intent={accept?.intent ?? Intent.PRIMARY}
          onClick={async () => {
            const token = createLoading?.(LoadingType.GLOBAL);
            try {
              await onConfirm()
                .then(() => {
                  setOpen(false);
                })
                .catch((error) => {
                  setError(error.message);
                })
                .finally(() => {
                  token && clearLoading?.(token);
                });
            } catch (e: any) {
              console.error("Uncaught exception from ConfirmDialog.onConfirm(): ", e);
              setError("Confirm failed: " + e.message);
              token && clearLoading?.(token);
            }
          }}
          disabled={disabled}
        >
          {accept?.text ?? "Confirm"}
        </Button>
        <Button icon={IconNames.CROSS} intent={Intent.NONE} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export function ViewDialog({
  open,
  setOpen,
  title,
  icon,
  children,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  icon?: IconName;
  children?: React.ReactNode;
}) {
  return (
    <Dialog title={title} icon={icon} isOpen={open} onClose={() => setOpen(false)}>
      <DialogBody>{children}</DialogBody>
      <DialogFooter>
        <Button icon={IconNames.CROSS} intent={Intent.NONE} onClick={() => setOpen(false)}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export function DialogFactory({}: {
  type: DialogType.Create;
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  icon?: IconName;
  accept?: {
    text?: string;
    icon?: IconName;
    intent?: Intent;
  };
  onAccept: () => Promise<void>;
  disabled?: boolean;
  children?: React.ReactNode;
}): React.ReactNode;
export function DialogFactory({}: {
  type: DialogType.Read;
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  icon?: IconName;
  onAccept?: () => Promise<void>;
  disabled?: boolean;
  children?: React.ReactNode;
}): React.ReactNode;
export function DialogFactory({}: {
  type: DialogType.Update;
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  icon?: IconName;
  accept?: {
    text?: string;
    icon?: IconName;
    intent?: Intent;
  };
  onAccept: () => Promise<void>;
  disabled?: boolean;
  children?: React.ReactNode;
}): React.ReactNode;
export function DialogFactory({}: {
  type: DialogType.Delete;
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  icon?: IconName;
  accept?: {
    text?: string;
    icon?: IconName;
    intent?: Intent;
  };
  onAccept: () => Promise<void>;
  disabled?: boolean;
  children?: React.ReactNode;
}): React.ReactNode;
export function DialogFactory({}: {
  type: DialogType.Confirm;
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  icon?: IconName;
  accept?: {
    text?: string;
    icon?: IconName;
    intent?: Intent;
  };
  onAccept: () => Promise<void>;
  disabled?: boolean;
  children?: React.ReactNode;
}): React.ReactNode;
export function DialogFactory({}: {
  type: DialogType.View;
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  icon?: IconName;
  children?: React.ReactNode;
}): React.ReactNode;
export function DialogFactory({
  type,
  open,
  setOpen,
  title,
  icon,
  accept,
  onAccept,
  disabled,
  children,
}: {
  type: DialogType;
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  icon?: IconName;
  accept?: {
    text?: string;
    icon?: IconName;
    intent?: Intent;
  };
  onAccept?: () => Promise<void>;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  switch (type) {
    case DialogType.Create:
      return (
        <CreateDialog
          open={open}
          setOpen={setOpen}
          title={title}
          icon={icon}
          accept={accept}
          onCreate={onAccept!}
          disabled={disabled}
        >
          {children}
        </CreateDialog>
      );
    case DialogType.Read:
      return (
        <ReadDialog open={open} setOpen={setOpen} title={title} icon={icon}>
          {children}
        </ReadDialog>
      );
    case DialogType.Update:
      return (
        <UpdateDialog
          open={open}
          setOpen={setOpen}
          title={title}
          icon={icon}
          accept={accept}
          onUpdate={onAccept!}
          disabled={disabled}
        >
          {children}
        </UpdateDialog>
      );
    case DialogType.Delete:
      return (
        <DeleteDialog
          open={open}
          setOpen={setOpen}
          title={title}
          icon={icon}
          accept={accept}
          onDelete={onAccept!}
          disabled={disabled}
        >
          {children}
        </DeleteDialog>
      );
    case DialogType.Confirm:
      return (
        <ConfirmDialog
          open={open}
          setOpen={setOpen}
          title={title}
          icon={icon}
          accept={accept}
          onConfirm={onAccept!}
          disabled={disabled}
        >
          {children}
        </ConfirmDialog>
      );
    case DialogType.View:
      return (
        <ViewDialog open={open} setOpen={setOpen} title={title} icon={icon}>
          {children}
        </ViewDialog>
      );
    default:
      throw new Error("Unhandled dialog type: " + type);
  }
}
