"use client";

import { Button, Callout, Dialog, DialogBody, DialogFooter, FormGroup, Intent, TextArea } from "@blueprintjs/core";
import React, { useContext, useEffect, useState } from "react";
import { IconName, IconNames } from "@blueprintjs/icons";
import {
  ReadBannersDocument,
  ReadBannersQuery,
  DeleteBannerDocument,
  CreateBannerDocument,
  UpdateBannerDocument,
} from "@/generated/graphql-codegen/graphql";
import { DateInput3, TimePrecision } from "@blueprintjs/datetime2";
import { useMutation } from "@apollo/client";
import { Term } from "@/utils/client";
import { LoadingContext, LoadingType } from "../components/providers";

export function CreateBanner({
  open,
  setOpen,
  icon,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
}) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [expiration, setExpiration] = useState("");

  const { createLoading, clearLoading } = useContext(LoadingContext);

  const [createBanner] = useMutation(CreateBannerDocument, {
    refetchQueries: [ReadBannersDocument],
  });

  useEffect(() => {
    setError("");
    setMessage("");
    setExpiration(new Date(new Date().getTime() + 1 * 60 * 60 * 1000).toLocaleString());
  }, [open]);

  return (
    <Dialog title="Create Banner" icon={icon} isOpen={open} onClose={() => setOpen(false)}>
      <DialogBody>
        <FormGroup label="Message">
          <TextArea id="message" value={message} onChange={(event) => setMessage(event.target.value)} rows={5} fill />
        </FormGroup>
        <FormGroup label="Expiration">
          <DateInput3
            value={expiration}
            onChange={(v) => v && setExpiration(v)}
            minDate={new Date()}
            timePrecision={TimePrecision.MINUTE}
          />
        </FormGroup>
        {error && <Callout intent={Intent.DANGER}>{error}</Callout>}
      </DialogBody>
      <DialogFooter>
        <Button
          icon={IconNames.NOTIFICATIONS}
          intent={Intent.PRIMARY}
          onClick={async () => {
            const token = createLoading?.(LoadingType.GLOBAL);
            try {
              await createBanner({
                variables: {
                  create: {
                    message,
                    expiration: new Date(expiration),
                  },
                },
              })
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
              console.error("Failed to create banner: ", e);
              setError("Failed to create banner: " + e.message);
              token && clearLoading?.(token);
            }
          }}
        >
          Create
        </Button>
        <Button icon={IconNames.CROSS} intent={Intent.NONE} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export function UpdateBanner({
  open,
  setOpen,
  icon,
  banner,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  banner?: Term<NonNullable<ReadBannersQuery["readBanners"]>[0]>;
}) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState(banner?.message ?? "");
  const [expiration, setExpiration] = useState(banner?.expiration ?? new Date());

  const { createLoading, clearLoading } = useContext(LoadingContext);

  const [updateBanner] = useMutation(UpdateBannerDocument, {
    refetchQueries: [ReadBannersDocument],
  });

  useEffect(() => {
    setError("");
    setMessage(banner?.message ?? "");
    setExpiration(banner?.expiration ?? new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog title="Update Banner" icon={icon} isOpen={open} onClose={() => setOpen(false)}>
      <DialogBody>
        <FormGroup label="Message">
          <TextArea id="message" value={message} onChange={(event) => setMessage(event.target.value)} rows={5} fill />
        </FormGroup>
        <FormGroup label="Expiration">
          <DateInput3
            value={expiration.toString()}
            onChange={(v) => v && setExpiration(new Date(v))}
            minDate={new Date()}
            timePrecision={TimePrecision.MINUTE}
          />
        </FormGroup>
        {error && <Callout intent={Intent.DANGER}>{error}</Callout>}
      </DialogBody>
      <DialogFooter>
        <Button
          icon={IconNames.NOTIFICATIONS}
          intent={Intent.PRIMARY}
          onClick={async () => {
            const token = createLoading?.(LoadingType.GLOBAL);
            try {
              await updateBanner({
                variables: {
                  where: { id: banner?.id },
                  update: {
                    ...(message !== banner?.message && { message }),
                    ...(expiration !== banner?.expiration && { expiration: new Date(expiration) }),
                  },
                },
              })
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
              console.error("Failed to update banner: ", e);
              setError("Failed to update banner: " + e.message);
              token && clearLoading?.(token);
            }
          }}
          disabled={message === banner?.message && expiration === banner?.expiration}
        >
          Update
        </Button>
        <Button icon={IconNames.CROSS} intent={Intent.NONE} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export function DeleteBanner({
  open,
  setOpen,
  icon,
  banner,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  banner?: Term<NonNullable<ReadBannersQuery["readBanners"]>[0]>;
}) {
  const [error, setError] = useState("");

  const { createLoading, clearLoading } = useContext(LoadingContext);

  const [deleteBanner] = useMutation(DeleteBannerDocument, {
    refetchQueries: [ReadBannersDocument],
  });

  useEffect(() => {
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog title="Delete Banner" icon={icon} isOpen={open} onClose={() => setOpen(false)}>
      <DialogBody>
        <p>Are you sure you want to delete the banner?</p>
        {error && <Callout intent={Intent.DANGER}>{error}</Callout>}
      </DialogBody>
      <DialogFooter>
        <Button
          icon={IconNames.TRASH}
          intent={Intent.DANGER}
          onClick={async () => {
            const token = createLoading?.(LoadingType.GLOBAL);
            try {
              await deleteBanner({ variables: { where: { id: banner?.id } } })
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
              console.error("Failed to delete banner: ", e);
              setError("Failed to delete banner: " + e.message);
              token && clearLoading?.(token);
            }
          }}
        >
          Delete
        </Button>
        <Button icon={IconNames.CROSS} intent={Intent.NONE} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
