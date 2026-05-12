"use client";

import {
  Button,
  Callout,
  Checkbox,
  FormGroup,
  HTMLSelect,
  HTMLTable,
  InputGroup,
  Intent,
  NumericInput,
  Pre,
  Tag,
} from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import { IconName } from "@blueprintjs/icons";
import {
  ReadBackupDestinationsDocument,
  ReadBackupDestinationsQuery,
  ReadBackupRunsDocument,
  ReadBackupRunsQuery,
  ReadBackupRunDocument,
  ReadBackupRunQuery,
  ReadBackupKeysDocument,
  ReadBackupKeysQuery,
  ReadActiveBackupKeyDocument,
  CreateBackupDestinationDocument,
  UpdateBackupDestinationDocument,
  DeleteBackupDestinationDocument,
  TriggerBackupRunDocument,
  CancelBackupRunDocument,
  DeleteBackupArchiveDocument,
  RotateBackupKeyDocument,
  AcknowledgeBackupKeyDocument,
  DownloadBackupPrivateKeyDocument,
  BackupDestinationType,
} from "@/graphql-codegen/graphql";
import { useMutation, useQuery } from "@apollo/client";
import { Term } from "@/utils/client";
import { ConfirmDialog, CreateDialog, DeleteDialog, UpdateDialog, ViewDialog } from "../dialog";
import styles from "./page.module.scss";

export type BackupDestination = NonNullable<ReadBackupDestinationsQuery["readBackupDestinations"]>[0];
export type BackupRun = NonNullable<ReadBackupRunsQuery["readBackupRuns"]>[0];
export type BackupRunDestination = NonNullable<
  NonNullable<ReadBackupRunQuery["readBackupRun"]>["destinations"]
>[number];
export type BackupKey = NonNullable<ReadBackupKeysQuery["readBackupKeys"]>[0];

const REFETCH_DESTINATIONS = [ReadBackupDestinationsDocument];
const REFETCH_RUNS = [ReadBackupRunsDocument];
const REFETCH_KEYS = [ReadBackupKeysDocument, ReadActiveBackupKeyDocument];

/** Format a byte count into a human-readable string. */
export function formatBytes(bytes?: string | number | bigint | null): string {
  if (bytes == null) return "—";
  const n = typeof bytes === "bigint" ? Number(bytes) : typeof bytes === "string" ? Number(bytes) : bytes;
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / Math.pow(1024, i);
  return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

/** Map a Backup*Status value to a Blueprint intent. */
export function statusIntent(status?: string | null): Intent {
  switch (status) {
    case "Success":
      return Intent.SUCCESS;
    case "Running":
      return Intent.PRIMARY;
    case "Failed":
      return Intent.DANGER;
    case "Cancelled":
    case "Skipped":
      return Intent.WARNING;
    default:
      return Intent.NONE;
  }
}

/** Render a status string as a colored tag. */
export function StatusTag({ status }: { status?: string | null }) {
  return <Tag intent={statusIntent(status)}>{status ?? "—"}</Tag>;
}

/**
 * Render an archive availability tri-state (Available / Missing / Removed)
 * as a colored tag. `Available` is green, `Missing` is red (the archive
 * vanished unintentionally), `Removed` is grey (operator cleanup).
 */
export function AvailabilityTag({ availability }: { availability?: string | null }) {
  switch (availability) {
    case "Available":
      return <Tag intent={Intent.SUCCESS}>Available</Tag>;
    case "Missing":
      return <Tag intent={Intent.DANGER}>Missing</Tag>;
    case "Removed":
      return <Tag intent={Intent.NONE}>Removed</Tag>;
    default:
      return <Tag intent={Intent.NONE}>—</Tag>;
  }
}

/**
 * Compose a Run's displayed status: non-success runs show their run status
 * verbatim, but a successful run whose archive has been cleaned up or lost
 * surfaces the archive availability instead ("Removed" / "Missing"). This
 * way the Runs table never lies by labelling an empty backup as "Success".
 */
export function RunStatusTag({
  status,
  archiveAvailability,
}: {
  status?: string | null;
  archiveAvailability?: string | null;
}) {
  if (status === "Success" && archiveAvailability && archiveAvailability !== "Available") {
    return <AvailabilityTag availability={archiveAvailability} />;
  }
  return <StatusTag status={status} />;
}

/** Shared fields used by both the Create and Update destination dialogs. */
interface DestinationFieldsProps {
  name: string;
  setName: (v: string) => void;
  type: BackupDestinationType;
  setType: (v: BackupDestinationType) => void;
  output: string;
  setOutput: (v: string) => void;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  order: number;
  setOrder: (v: number) => void;
  sseMode: string;
  setSseMode: (v: string) => void;
  sseKmsKeyId: string;
  setSseKmsKeyId: (v: string) => void;
}

function DestinationFields(props: DestinationFieldsProps) {
  const {
    name,
    setName,
    type,
    setType,
    output,
    setOutput,
    enabled,
    setEnabled,
    order,
    setOrder,
    sseMode,
    setSseMode,
    sseKmsKeyId,
    setSseKmsKeyId,
  } = props;
  return (
    <>
      <FormGroup label="Name">
        <InputGroup value={name} onChange={(e) => setName(e.target.value)} fill />
      </FormGroup>
      <FormGroup label="Type">
        <HTMLSelect
          value={type}
          onChange={(e) => setType(e.currentTarget.value as BackupDestinationType)}
          options={Object.values(BackupDestinationType)}
          fill
        />
      </FormGroup>
      {type === BackupDestinationType.Local ? (
        <Callout intent={Intent.NONE}>
          Backups are written to (<code>./docker/backups/</code>).
        </Callout>
      ) : (
        <FormGroup label="Output" helperText="s3://bucket/prefix/">
          <InputGroup value={output} onChange={(e) => setOutput(e.target.value)} fill />
        </FormGroup>
      )}
      <FormGroup label="Order" helperText="Lower numbers run first">
        <NumericInput value={order} onValueChange={setOrder} min={0} fill />
      </FormGroup>
      <FormGroup>
        <Checkbox checked={enabled} label="Enabled" onChange={(e) => setEnabled(e.currentTarget.checked)} />
      </FormGroup>
      {type === BackupDestinationType.S3 && (
        <>
          <FormGroup label="SSE Mode" helperText="e.g. AES256 or aws:kms">
            <InputGroup value={sseMode} onChange={(e) => setSseMode(e.target.value)} fill />
          </FormGroup>
          <FormGroup label="SSE KMS Key Id" helperText="Required when SSE Mode is aws:kms">
            <InputGroup value={sseKmsKeyId} onChange={(e) => setSseKmsKeyId(e.target.value)} fill />
          </FormGroup>
        </>
      )}
    </>
  );
}

export function CreateDestination({
  open,
  setOpen,
  icon,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<BackupDestinationType>(BackupDestinationType.Local);
  const [output, setOutput] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [order, setOrder] = useState(0);
  const [sseMode, setSseMode] = useState("");
  const [sseKmsKeyId, setSseKmsKeyId] = useState("");

  const [createDestination] = useMutation(CreateBackupDestinationDocument, { refetchQueries: REFETCH_DESTINATIONS });

  useEffect(() => {
    setName("");
    setType(BackupDestinationType.Local);
    setOutput("");
    setEnabled(true);
    setOrder(0);
    setSseMode("");
    setSseKmsKeyId("");
  }, [open]);

  const onCreate = useCallback(async () => {
    await createDestination({
      variables: {
        name,
        type,
        output: type === BackupDestinationType.Local ? null : output,
        enabled,
        order,
        sseMode: type === BackupDestinationType.S3 && sseMode ? sseMode : null,
        sseKmsKeyId: type === BackupDestinationType.S3 && sseKmsKeyId ? sseKmsKeyId : null,
      },
    });
  }, [createDestination, name, type, output, enabled, order, sseMode, sseKmsKeyId]);

  return (
    <CreateDialog
      title="Create Destination"
      icon={icon}
      open={open}
      setOpen={setOpen}
      onCreate={onCreate}
      disabled={!name.trim() || (type !== BackupDestinationType.Local && !output.trim())}
    >
      <DestinationFields
        name={name}
        setName={setName}
        type={type}
        setType={setType}
        output={output}
        setOutput={setOutput}
        enabled={enabled}
        setEnabled={setEnabled}
        order={order}
        setOrder={setOrder}
        sseMode={sseMode}
        setSseMode={setSseMode}
        sseKmsKeyId={sseKmsKeyId}
        setSseKmsKeyId={setSseKmsKeyId}
      />
    </CreateDialog>
  );
}

export function UpdateDestination({
  open,
  setOpen,
  icon,
  destination,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  destination?: Term<BackupDestination>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<BackupDestinationType>(BackupDestinationType.Local);
  const [output, setOutput] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [order, setOrder] = useState(0);
  const [sseMode, setSseMode] = useState("");
  const [sseKmsKeyId, setSseKmsKeyId] = useState("");

  const [updateDestination] = useMutation(UpdateBackupDestinationDocument, { refetchQueries: REFETCH_DESTINATIONS });

  useEffect(() => {
    setName(destination?.name ?? "");
    setType((destination?.type as BackupDestinationType) ?? BackupDestinationType.Local);
    setOutput(destination?.output ?? "");
    setEnabled(destination?.enabled ?? true);
    setOrder(destination?.order ?? 0);
    setSseMode(destination?.sseMode ?? "");
    setSseKmsKeyId(destination?.sseKmsKeyId ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, destination?.id]);

  const onUpdate = useCallback(async () => {
    if (!destination?.id) return;
    await updateDestination({
      variables: {
        id: destination.id,
        name,
        type,
        output: type === BackupDestinationType.Local ? null : output,
        enabled,
        order,
        sseMode: type === BackupDestinationType.S3 ? sseMode || null : null,
        sseKmsKeyId: type === BackupDestinationType.S3 ? sseKmsKeyId || null : null,
      },
    });
  }, [updateDestination, destination?.id, name, type, output, enabled, order, sseMode, sseKmsKeyId]);

  return (
    <UpdateDialog
      title="Update Destination"
      icon={icon}
      open={open}
      setOpen={setOpen}
      onUpdate={onUpdate}
      disabled={!name.trim() || (type !== BackupDestinationType.Local && !output.trim())}
    >
      <DestinationFields
        name={name}
        setName={setName}
        type={type}
        setType={setType}
        output={output}
        setOutput={setOutput}
        enabled={enabled}
        setEnabled={setEnabled}
        order={order}
        setOrder={setOrder}
        sseMode={sseMode}
        setSseMode={setSseMode}
        sseKmsKeyId={sseKmsKeyId}
        setSseKmsKeyId={setSseKmsKeyId}
      />
    </UpdateDialog>
  );
}

export function DeleteDestination({
  open,
  setOpen,
  icon,
  destination,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  destination?: Term<BackupDestination>;
}) {
  const [deleteDestination] = useMutation(DeleteBackupDestinationDocument, { refetchQueries: REFETCH_DESTINATIONS });
  const onDelete = useCallback(async () => {
    if (!destination?.id) return;
    await deleteDestination({ variables: { id: destination.id } });
  }, [deleteDestination, destination?.id]);
  return (
    <DeleteDialog title="Delete Destination" icon={icon} open={open} setOpen={setOpen} onDelete={onDelete}>
      <p>
        Are you sure you want to delete the destination <strong>{destination?.name}</strong>?
      </p>
    </DeleteDialog>
  );
}

export function TriggerRun({
  open,
  setOpen,
  icon,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
}) {
  const [triggerRun] = useMutation(TriggerBackupRunDocument, { refetchQueries: REFETCH_RUNS });
  return (
    <ConfirmDialog
      title="Run Backup Now"
      icon={icon}
      open={open}
      setOpen={setOpen}
      onConfirm={async () => {
        await triggerRun();
      }}
      accept={{ text: "Run Now", intent: Intent.PRIMARY }}
    >
      <p>Queue a new backup run using the current policy? The sidecar will execute each destination in order.</p>
    </ConfirmDialog>
  );
}

export function CancelRun({
  open,
  setOpen,
  icon,
  run,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  run?: Term<BackupRun>;
}) {
  const [cancelRun] = useMutation(CancelBackupRunDocument, { refetchQueries: REFETCH_RUNS });
  return (
    <ConfirmDialog
      title="Cancel Backup Run"
      icon={icon}
      open={open}
      setOpen={setOpen}
      onConfirm={async () => {
        if (!run?.id) return;
        await cancelRun({ variables: { id: run.id } });
      }}
      accept={{ text: "Cancel Run", intent: Intent.WARNING }}
    >
      <p>
        Request cancellation of backup run <code>{run?.id}</code>? The sidecar will stop at its next checkpoint.
      </p>
    </ConfirmDialog>
  );
}

export function ViewRun({
  open,
  setOpen,
  icon,
  run,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  run?: Term<BackupRun>;
}) {
  // The Runs list query is slim (no components/destinations/requestedBy) to
  // stay under the GraphQL complexity budget at take=100. Fetch full detail
  // on demand when the dialog opens.
  const { data, loading } = useQuery(ReadBackupRunDocument, {
    variables: { id: run?.id ?? "" },
    skip: !open || !run?.id,
    fetchPolicy: "cache-and-network",
  });
  const detail = data?.readBackupRun;
  const [archiveToDelete, setArchiveToDelete] = useState<BackupRunDestination | undefined>(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  return (
    <ViewDialog
      title={`Backup Run ${run?.id ?? ""}`}
      icon={icon}
      open={open}
      setOpen={setOpen}
      style={{ width: "60%", minWidth: 800 }}
    >
      {!run ? (
        <p>No run selected.</p>
      ) : !detail ? (
        <p>{loading ? "Loading…" : "Run not found."}</p>
      ) : (
        <>
          <HTMLTable striped compact style={{ width: "100%" }}>
            <tbody>
              <tr>
                <td>
                  <strong>Status</strong>
                </td>
                <td>
                  <StatusTag status={detail.status} />
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Trigger</strong>
                </td>
                <td>{detail.trigger}</td>
              </tr>
              <tr>
                <td>
                  <strong>Requested By</strong>
                </td>
                <td>{detail.requestedBy?.name ?? detail.requestedBy?.email ?? "—"}</td>
              </tr>
              <tr>
                <td>
                  <strong>Started</strong>
                </td>
                <td>{detail.startedAt ? new Date(detail.startedAt).toLocaleString() : "—"}</td>
              </tr>
              <tr>
                <td>
                  <strong>Finished</strong>
                </td>
                <td>{detail.finishedAt ? new Date(detail.finishedAt).toLocaleString() : "—"}</td>
              </tr>
              <tr>
                <td>
                  <strong>Heartbeat</strong>
                </td>
                <td>{detail.heartbeatAt ? new Date(detail.heartbeatAt).toLocaleString() : "—"}</td>
              </tr>
              <tr>
                <td>
                  <strong>Archive</strong>
                </td>
                <td className={styles.code}>{detail.archivePath ?? "—"}</td>
              </tr>
              <tr>
                <td>
                  <strong>Archive Size</strong>
                </td>
                <td>{formatBytes(detail.archiveBytes)}</td>
              </tr>
              <tr>
                <td>
                  <strong>Archive SHA-256</strong>
                </td>
                <td className={styles.code}>{detail.archiveSha256 ?? "—"}</td>
              </tr>
              <tr>
                <td>
                  <strong>Key Fingerprint</strong>
                </td>
                <td className={styles.code}>{detail.keyFingerprint ?? "—"}</td>
              </tr>
            </tbody>
          </HTMLTable>
          {detail.errorMessage && (
            <Callout intent={Intent.DANGER} title="Error">
              <Pre>{detail.errorMessage}</Pre>
            </Callout>
          )}
          <h4>Components</h4>
          <HTMLTable striped compact style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Status</th>
                <th>Bytes</th>
                <th>Duration</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {(detail.components ?? []).map((c) => (
                <tr key={c.id}>
                  <td>{c.type}</td>
                  <td>{c.name}</td>
                  <td>
                    <StatusTag status={c.status} />
                  </td>
                  <td>{formatBytes(c.bytes)}</td>
                  <td>{c.durationMs != null ? `${c.durationMs} ms` : "—"}</td>
                  <td>{c.error ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
          <h4>Destinations</h4>
          <HTMLTable striped compact style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Destination</th>
                <th>Type</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th>Final Path</th>
                <th>Archive</th>
                <th>Error</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(detail.destinations ?? []).map((d) => (
                <tr key={d.id}>
                  <td>{d.destination?.name}</td>
                  <td>{d.destination?.type}</td>
                  <td>
                    <StatusTag status={d.status} />
                  </td>
                  <td>{formatBytes(d.uploadedBytes)}</td>
                  <td className={styles.code}>{d.finalPath ?? "—"}</td>
                  <td>
                    <AvailabilityTag availability={d.availability} />
                    {d.archiveDeletedAt ? (
                      <small style={{ marginLeft: 8, opacity: 0.7 }}>
                        {new Date(d.archiveDeletedAt).toLocaleString()}
                      </small>
                    ) : null}
                  </td>
                  <td>{d.error ?? ""}</td>
                  <td>
                    <Button
                      small
                      minimal
                      intent={Intent.DANGER}
                      icon="trash"
                      disabled={d.availability !== "Available"}
                      onClick={() => {
                        setArchiveToDelete(d);
                        setDeleteOpen(true);
                      }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
          <DeleteArchive
            open={deleteOpen}
            setOpen={setDeleteOpen}
            icon="trash"
            runDestination={archiveToDelete}
            runId={detail.id ?? undefined}
          />
        </>
      )}
    </ViewDialog>
  );
}

export function DeleteArchive({
  open,
  setOpen,
  icon,
  runDestination,
  runId,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  runDestination?: Term<BackupRunDestination>;
  runId?: string;
}) {
  const [deleteArchive] = useMutation(DeleteBackupArchiveDocument, {
    refetchQueries: runId
      ? [{ query: ReadBackupRunDocument, variables: { id: runId } }, ...REFETCH_RUNS]
      : REFETCH_RUNS,
  });
  return (
    <ConfirmDialog
      title="Delete Archive File"
      icon={icon}
      open={open}
      setOpen={setOpen}
      onConfirm={async () => {
        if (!runDestination?.id) return;
        await deleteArchive({ variables: { runDestinationId: runDestination.id } });
      }}
      accept={{ text: "Delete Archive", intent: Intent.DANGER }}
      disabled={!runDestination?.id || runDestination?.availability !== "Available"}
    >
      <Callout intent={Intent.WARNING} title="This action cannot be undone">
        The backup run will remain as an audit record, but the archive file itself will be permanently removed.
      </Callout>
      <p>
        Delete archive at <code>{runDestination?.finalPath ?? "—"}</code>?
      </p>
    </ConfirmDialog>
  );
}

export function RotateKey({
  open,
  setOpen,
  icon,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
}) {
  const [rotateKey] = useMutation(RotateBackupKeyDocument, { refetchQueries: REFETCH_KEYS });
  return (
    <ConfirmDialog
      title="Rotate Backup Key"
      icon={icon}
      open={open}
      setOpen={setOpen}
      onConfirm={async () => {
        await rotateKey();
      }}
      accept={{ text: "Rotate Key", intent: Intent.WARNING }}
    >
      <Callout intent={Intent.WARNING} title="This will generate a new backup key">
        Existing backups remain decryptable with their original keys. Newly created backups will use the new key. You
        must acknowledge and download the new private key to be able to restore backups created after this rotation.
      </Callout>
    </ConfirmDialog>
  );
}

export function AcknowledgeKey({
  open,
  setOpen,
  icon,
  backupKey,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  backupKey?: BackupKey;
}) {
  const [acknowledgeKey] = useMutation(AcknowledgeBackupKeyDocument, { refetchQueries: REFETCH_KEYS });
  return (
    <ConfirmDialog
      title="Acknowledge Backup Key"
      icon={icon}
      open={open}
      setOpen={setOpen}
      onConfirm={async () => {
        if (!backupKey?.id) return;
        await acknowledgeKey({ variables: { id: backupKey.id } });
      }}
      accept={{ text: "Acknowledge", intent: Intent.PRIMARY }}
      disabled={!backupKey?.id}
    >
      <p>
        Confirm that you have recorded the fingerprint below and understand that you are responsible for securing the
        private key offline before backups encrypted with this key will be restorable.
      </p>
      <HTMLTable striped compact>
        <tbody>
          <tr>
            <td>
              <strong>Algorithm</strong>
            </td>
            <td>{backupKey?.algorithm}</td>
          </tr>
          <tr>
            <td>
              <strong>Fingerprint</strong>
            </td>
            <td className={styles.code}>{backupKey?.fingerprint}</td>
          </tr>
        </tbody>
      </HTMLTable>
      {backupKey?.publicKey && (
        <>
          <p>
            <strong>Public Key</strong>
          </p>
          <Pre className={styles.code}>{backupKey.publicKey}</Pre>
        </>
      )}
    </ConfirmDialog>
  );
}

export function DownloadPrivateKey({
  open,
  setOpen,
  icon,
  backupKey,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  icon?: IconName;
  backupKey?: BackupKey;
}) {
  const [downloadPrivateKey, { data, loading, error, reset }] = useMutation(DownloadBackupPrivateKeyDocument);
  useEffect(() => {
    if (open && backupKey?.id) {
      downloadPrivateKey({ variables: { id: backupKey.id } });
    } else {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, backupKey?.id]);

  const pem = data?.downloadBackupPrivateKey ?? "";

  const onCopy = useCallback(async () => {
    if (pem) await navigator.clipboard.writeText(pem);
  }, [pem]);

  const onDownloadFile = useCallback(() => {
    if (!pem) return;
    const blob = new Blob([pem], { type: "application/x-pem-file" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-private-key-${backupKey?.fingerprint ?? "key"}.pem`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [pem, backupKey?.fingerprint]);

  return (
    <ConfirmDialog
      title="Download Private Key"
      icon={icon}
      open={open}
      setOpen={setOpen}
      onConfirm={async () => {
        onDownloadFile();
      }}
      accept={{ text: "Download .pem", intent: Intent.PRIMARY }}
      disabled={!pem || loading}
    >
      <Callout intent={Intent.WARNING} title="Sensitive material">
        This private key is required to decrypt backups encrypted with fingerprint{" "}
        <code>{backupKey?.fingerprint}</code>. Save it to secure offline storage immediately and do not share it.
      </Callout>
      {loading && <p>Loading…</p>}
      {error && (
        <Callout intent={Intent.DANGER} title="Unable to retrieve private key">
          {error.message}
          {!backupKey?.acknowledged && (
            <p>
              <em>Tip: acknowledge this key first (Acknowledge action in the Keys table).</em>
            </p>
          )}
        </Callout>
      )}
      {pem && (
        <>
          <p>
            <strong>Private Key</strong>{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onCopy();
              }}
            >
              (copy to clipboard)
            </a>
          </p>
          <Pre className={styles.code}>{pem}</Pre>
        </>
      )}
    </ConfirmDialog>
  );
}
