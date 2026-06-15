"use client";

import styles from "./page.module.scss";
import {
  Button,
  Callout,
  Checkbox,
  ControlGroup,
  FormGroup,
  Icon,
  InputGroup,
  Intent,
  MenuItem,
  NumericInput,
  Tab,
  TabId,
  Tabs,
  TabsExpander,
  Tag,
} from "@blueprintjs/core";
import { MultiSelect } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";
import { useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import {
  ReadBackupPolicyDocument,
  ReadBackupDestinationsDocument,
  ReadBackupDestinationsQuery,
  ReadBackupRunsDocument,
  ReadBackupRunsQuery,
  ReadBackupKeysDocument,
  ReadBackupKeysQuery,
  ReadActiveBackupKeyDocument,
  SubscribeBackupPolicyDocument,
  SubscribeBackupDestinationsDocument,
  SubscribeBackupRunsDocument,
  SubscribeBackupKeysDocument,
  UpdateBackupPolicyDocument,
  DiscoverBackupSourcesDocument,
  DiscoverBackupSourcesQuery,
} from "@/graphql-codegen/graphql";
import { NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { Term, filter } from "@/utils/client";
import { LocalLoading, Search, Table } from "../components/common";
import { DialogType } from "../types";
import {
  AcknowledgeKey,
  BackupDestination,
  BackupKey,
  BackupRun,
  CancelRun,
  CreateDestination,
  DeleteDestination,
  DownloadPrivateKey,
  RotateKey,
  RunStatusTag,
  TriggerRun,
  UpdateDestination,
  ViewRun,
  formatBytes,
} from "./dialog";

// Lenient cron validator accepting 5 or 6 space-separated fields.
const CRON_REGEX = /^(\S+\s+){4,5}\S+$/;

type DestinationDialogState = {
  type: DialogType;
  destination?: Term<BackupDestination>;
};
type RunDialogState = {
  type: DialogType;
  run?: Term<BackupRun>;
};
type KeyDialogState = {
  type: DialogType;
  backupKey?: BackupKey;
};

// Discovery-driven MultiSelect. `items` is the pool of known strings;
// `selected` is what the policy WILL back up (inverse of the exclude list);
// `onAddExclude`/`onRemoveExclude` manipulate the stored exclude set.
//
// Custom entries are NOT allowed for services/volumes/paths - you can't
// exclude something that doesn't exist in discovery. Only the env-files
// picker (which has a separate code path) accepts free-typed entries.
interface ExcludePickerProps {
  items: string[];
  excluded: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  renderLabel?: (item: string) => React.ReactNode;
  // Map of item → reason for auto-exclude (e.g. "self-reference",
  // "cache", "repo-content", "socket"). Items with an entry render a
  // warning tag in the picker and are pre-populated in excludes by the
  // server on first-run seed.
  autoExcludes?: Map<string, string>;
}
function ExcludePicker({
  items,
  excluded,
  onChange,
  placeholder,
  renderLabel,
  autoExcludes,
}: ExcludePickerProps) {
  // Effective exclude set for display: operator-chosen excludes PLUS
  // anything discovery flagged as auto-excluded. Auto-excluded items are
  // enforced by the worker at run time regardless of what's stored in
  // the policy, so showing them as selected in the picker would lie.
  const excludedSet = useMemo(() => {
    const s = new Set(excluded);
    if (autoExcludes) for (const key of autoExcludes.keys()) s.add(key);
    return s;
  }, [excluded, autoExcludes]);
  const selected = useMemo(() => items.filter((i) => !excludedSet.has(i)), [items, excludedSet]);
  return (
    <MultiSelect<string>
      items={items}
      selectedItems={selected}
      tagRenderer={(t) => renderLabel?.(t) ?? t}
      itemRenderer={(item, { handleClick, modifiers }) => {
        if (!modifiers.matchesPredicate) return null;
        const isSelected = !excludedSet.has(item);
        const autoReason = autoExcludes?.get(item);
        return (
          <MenuItem
            key={item}
            text={renderLabel?.(item) ?? item}
            labelElement={
              autoReason ? (
                <Tag minimal intent={Intent.WARNING}>auto-excluded ({autoReason})</Tag>
              ) : undefined
            }
            icon={isSelected ? IconNames.TICK : IconNames.BLANK}
            active={modifiers.active}
            onClick={handleClick}
            shouldDismissPopover={false}
            // Auto-excluded items are system-enforced; clicks do nothing
            // so the operator can't toggle them on (the worker would skip
            // them anyway). Visual cue is the warning tag above.
            disabled={!!autoReason}
          />
        );
      }}
      itemPredicate={(query, item) => item.toLowerCase().includes(query.toLowerCase())}
      onItemSelect={(item) => {
        if (autoExcludes?.has(item)) return;
        if (excludedSet.has(item)) {
          onChange(excluded.filter((e) => e !== item));
        } else {
          onChange([...excluded, item]);
        }
      }}
      onRemove={(item) => {
        if (autoExcludes?.has(item)) return;
        if (!excludedSet.has(item)) onChange([...excluded, item]);
      }}
      placeholder={placeholder}
      resetOnSelect
      popoverProps={{ minimal: true }}
      fill
    />
  );
}

// Env-file MultiSelect. Discovered files (source: scanned|compose) and user
// extras are offered together; removing a discovered item goes into
// excludeEnvFiles, removing an extra strips it from extraEnvFiles, and typing
// a new path appends to extraEnvFiles.
type EnvFileEntry = { path: string; source: "scanned" | "compose" | "extra" };
type DiscoveredEnvFile = NonNullable<
  NonNullable<DiscoverBackupSourcesQuery["discoverBackupSources"]>["envFiles"]
>[number];
interface EnvFilePickerProps {
  discovered: DiscoveredEnvFile[];
  excluded: string[];
  extras: string[];
  onExcludedChange: (next: string[]) => void;
  onExtrasChange: (next: string[]) => void;
}
function EnvFilePicker({ discovered, excluded, extras, onExcludedChange, onExtrasChange }: EnvFilePickerProps) {
  const discoveredSet = useMemo(
    () => new Set(discovered.map((d) => d.path).filter((p): p is string => !!p)),
    [discovered],
  );

  // Map of path → auto-exclude reason for discovered env files the
  // server classified as pristine (tracked & matches HEAD). User
  // extras are never auto-excluded.
  const autoExcludes = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of discovered) {
      if (d.path && d.autoExclude) m.set(d.path, d.autoExcludeReason ?? "auto");
    }
    return m;
  }, [discovered]);

  // Effective exclude set: operator-chosen excludes plus anything the
  // server flagged auto-exclude.
  const excludedSet = useMemo(() => {
    const s = new Set(excluded);
    for (const key of autoExcludes.keys()) s.add(key);
    return s;
  }, [excluded, autoExcludes]);

  const items: EnvFileEntry[] = useMemo(() => {
    const base: EnvFileEntry[] = discovered
      .filter((d): d is DiscoveredEnvFile & { path: string } => !!d.path)
      .map((d) => ({
        path: d.path,
        source: d.source === "compose" ? "compose" : "scanned",
      }));
    for (const p of extras) {
      if (!discoveredSet.has(p)) base.push({ path: p, source: "extra" });
    }
    return base.sort((a, b) => a.path.localeCompare(b.path));
  }, [discovered, extras, discoveredSet]);

  const selected: EnvFileEntry[] = useMemo(() => items.filter((i) => !excludedSet.has(i.path)), [items, excludedSet]);

  return (
    <MultiSelect<EnvFileEntry>
      items={items}
      selectedItems={selected}
      tagRenderer={(e) => (
        <>
          {e.path}{" "}
          <Tag minimal intent={Intent.PRIMARY}>
            {e.source}
          </Tag>
        </>
      )}
      itemRenderer={(item, { handleClick, modifiers }) => {
        if (!modifiers.matchesPredicate) return null;
        const isSelected = !excludedSet.has(item.path);
        const autoReason = autoExcludes.get(item.path);
        return (
          <MenuItem
            key={item.path}
            text={item.path}
            labelElement={
              <>
                <Tag minimal intent={Intent.PRIMARY}>
                  {item.source}
                </Tag>
                {autoReason ? (
                  <>
                    {" "}
                    <Tag minimal intent={Intent.WARNING}>auto-excluded ({autoReason})</Tag>
                  </>
                ) : null}
              </>
            }
            icon={isSelected ? IconNames.TICK : IconNames.BLANK}
            active={modifiers.active}
            onClick={handleClick}
            shouldDismissPopover={false}
            disabled={!!autoReason}
          />
        );
      }}
      itemPredicate={(query, item) => item.path.toLowerCase().includes(query.toLowerCase())}
      createNewItemFromQuery={(query) => ({ path: query.trim(), source: "extra" as const })}
      createNewItemRenderer={(query, active, handleClick) => (
        <MenuItem
          icon={IconNames.ADD}
          text={`Add "${query}"`}
          active={active}
          onClick={handleClick}
          shouldDismissPopover={false}
        />
      )}
      createNewItemPosition="first"
      onItemSelect={(item) => {
        if (autoExcludes.has(item.path)) return;
        if (item.source === "extra" && !discoveredSet.has(item.path) && !extras.includes(item.path)) {
          onExtrasChange([...extras, item.path]);
          return;
        }
        if (excludedSet.has(item.path)) {
          onExcludedChange(excluded.filter((e) => e !== item.path));
        } else {
          onExcludedChange([...excluded, item.path]);
        }
      }}
      onRemove={(item) => {
        if (autoExcludes.has(item.path)) return;
        if (item.source === "extra") {
          onExtrasChange(extras.filter((p) => p !== item.path));
        } else if (!excludedSet.has(item.path)) {
          onExcludedChange([...excluded, item.path]);
        }
      }}
      itemsEqual={(a, b) => a.path === b.path}
      placeholder="Env files (remove to exclude, type to add)"
      resetOnSelect
      popoverProps={{ minimal: true }}
      fill
    />
  );
}

function PolicyTab() {
  const { createNotification } = useContext(NotificationContext);

  const { data: queryData, startPolling, stopPolling } = useQuery(ReadBackupPolicyDocument);
  const { data: subData } = useSubscription(SubscribeBackupPolicyDocument, {
    onComplete() {
      stopPolling();
    },
    onError() {
      startPolling(5000);
    },
  });
  const { data: discoveryData } = useQuery(DiscoverBackupSourcesDocument);
  // readBackupPolicies returns a list; the policy is effectively a singleton
  // (the server side enforces a single active row), so use the first entry.
  const policy = (subData?.readBackupPolicies ?? queryData?.readBackupPolicies ?? [])[0];
  const discovery = discoveryData?.discoverBackupSources;
  // Discovery walks docker-compose.yml + scans the workspace; first fetch
  // takes long enough that the form would otherwise render with empty
  // pickers. Keep the tab blank behind a spinner until it arrives.
  const ready = discovery != null;

  const [enabled, setEnabled] = useState(true);
  const [cron, setCron] = useState("");
  const [retentionDays, setRetentionDays] = useState(30);
  const [excludeVolumes, setExcludeVolumes] = useState<string[]>([]);
  const [excludePaths, setExcludePaths] = useState<string[]>([]);
  const [excludeServices, setExcludeServices] = useState<string[]>([]);
  const [excludeEnvFiles, setExcludeEnvFiles] = useState<string[]>([]);
  const [extraEnvFiles, setExtraEnvFiles] = useState<string[]>([]);

  useEffect(() => {
    if (!policy) return;
    const strings = (xs: readonly (string | null | undefined)[] | null | undefined) =>
      (xs ?? []).filter((x): x is string => !!x);
    setEnabled(policy.enabled ?? true);
    setCron(policy.cron ?? "");
    setRetentionDays(policy.retentionDays ?? 30);
    setExcludeVolumes(strings(policy.excludeVolumes));
    setExcludePaths(strings(policy.excludePaths));
    setExcludeServices(strings(policy.excludeServices));
    setExcludeEnvFiles(strings(policy.excludeEnvFiles));
    setExtraEnvFiles(strings(policy.extraEnvFiles));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policy?.id, policy?.updatedAt]);

  const [updatePolicy, { loading: saving }] = useMutation(UpdateBackupPolicyDocument, {
    refetchQueries: [ReadBackupPolicyDocument],
  });

  const cronValid = !cron || CRON_REGEX.test(cron.trim());

  const onSave = async () => {
    try {
      await updatePolicy({
        variables: {
          enabled,
          cron: cron.trim() || null,
          retentionDays,
          excludeVolumes,
          excludePaths,
          excludeServices,
          excludeEnvFiles,
          extraEnvFiles,
        },
      });
      createNotification?.("Backup policy updated");
    } catch (e: any) {
      createNotification?.(e.message ?? "Failed to update policy", NotificationType.Error);
    }
  };

  const volumeItems = useMemo(
    () => (discovery?.volumes ?? []).map((v) => v.name).filter((n): n is string => !!n),
    [discovery?.volumes],
  );
  const pathItems = useMemo(
    () => (discovery?.paths ?? []).map((p) => p.path).filter((p): p is string => !!p),
    [discovery?.paths],
  );

  // Services picker shows only services with a known logical backup
  // strategy (pg_dump / mysqldump). Everything else contributes via the
  // Volumes / Host paths / Env files pickers.
  const serviceItems = useMemo(
    () =>
      (discovery?.services ?? [])
        .filter((s) => s.backupStrategy && s.name)
        .map((s) => s.name as string),
    [discovery?.services],
  );
  const serviceStrategy = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of discovery?.services ?? []) {
      if (s.name && s.backupStrategy) m.set(s.name, s.backupStrategy);
    }
    return m;
  }, [discovery?.services]);

  const autoExcludeVolumes = useMemo(
    () =>
      new Map(
        (discovery?.volumes ?? [])
          .filter((v) => v.autoExclude && v.name)
          .map((v) => [v.name as string, v.autoExcludeReason ?? "auto"] as const),
      ),
    [discovery?.volumes],
  );
  const autoExcludePaths = useMemo(
    () =>
      new Map(
        (discovery?.paths ?? [])
          .filter((p) => p.autoExclude && p.path)
          .map((p) => [p.path as string, p.autoExcludeReason ?? "auto"] as const),
      ),
    [discovery?.paths],
  );

  if (!ready) {
    return (
      <div className={styles.policy}>
        <LocalLoading />
      </div>
    );
  }

  return (
    <div className={styles.policy}>
      <FormGroup>
        <Checkbox
          checked={enabled}
          label="Enable scheduled backups"
          onChange={(e) => setEnabled(e.currentTarget.checked)}
        />
      </FormGroup>
      <FormGroup
        label={
          <>
            Schedule (cron)
            {process.env.NEXT_PUBLIC_INFO_CRON_URL ? (
              <a href={process.env.NEXT_PUBLIC_INFO_CRON_URL} target="_blank" rel="noopener noreferrer">
                <Icon icon={IconNames.INFO_SIGN} />
              </a>
            ) : null}
          </>
        }
        intent={cronValid ? Intent.NONE : Intent.DANGER}
        helperText={cronValid ? "Standard 5- or 6-field cron expression" : "Invalid cron expression"}
      >
        <InputGroup
          value={cron}
          onChange={(e) => setCron(e.target.value)}
          placeholder="0 3 * * *"
          intent={cronValid ? Intent.NONE : Intent.DANGER}
          fill
        />
      </FormGroup>
      <FormGroup label="Retention (days)" helperText="Older runs are pruned by the sidecar">
        <NumericInput value={retentionDays} onValueChange={setRetentionDays} min={1} fill />
      </FormGroup>
      <FormGroup
        label="Database services"
        helperText="Database services are backed up with a logical dump (pg_dump / mysqldump). Remove to skip a service's dump. Their data volumes are auto-excluded from the volume list — the dump is the authoritative backup; tarring a live DB volume would race with writes and produce an unrecoverable snapshot."
      >
        <ExcludePicker
          items={serviceItems}
          excluded={excludeServices}
          onChange={setExcludeServices}
          placeholder="Database services (remove to skip dump)"
          renderLabel={(s) => {
            const strategy = serviceStrategy.get(s);
            return (
              <>
                {s}
                {strategy ? (
                  <>
                    {" "}
                    <Tag minimal intent={Intent.PRIMARY}>
                      {strategy}
                    </Tag>
                  </>
                ) : null}
              </>
            );
          }}
        />
      </FormGroup>
      <FormGroup label="Volumes" helperText="All named volumes are backed up. Remove to exclude.">
        <ExcludePicker
          items={volumeItems}
          excluded={excludeVolumes}
          onChange={setExcludeVolumes}
          placeholder="Named volumes (remove to exclude)"
          autoExcludes={autoExcludeVolumes}
        />
      </FormGroup>
      <FormGroup label="Host paths" helperText="All bind-mounted paths are backed up. Remove to exclude.">
        <ExcludePicker
          items={pathItems}
          excluded={excludePaths}
          onChange={setExcludePaths}
          placeholder="Bind paths (remove to exclude)"
          autoExcludes={autoExcludePaths}
        />
      </FormGroup>
      <FormGroup
        label="Env files"
        helperText="All detected env files are backed up. Remove to exclude; type a path to add."
      >
        <EnvFilePicker
          discovered={discovery?.envFiles ?? []}
          excluded={excludeEnvFiles}
          extras={extraEnvFiles}
          onExcludedChange={setExcludeEnvFiles}
          onExtrasChange={setExtraEnvFiles}
        />
      </FormGroup>
      <ControlGroup>
        <div className={styles.spacer} />
        <Button
          icon={IconNames.FLOPPY_DISK}
          intent={Intent.PRIMARY}
          loading={saving}
          disabled={!cronValid}
          onClick={onSave}
        >
          Save Policy
        </Button>
      </ControlGroup>
    </div>
  );
}

function DestinationsTab() {
  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    field: keyof Term<BackupDestination>;
    direction: "Asc" | "Desc";
  }>({ field: "order", direction: "Asc" });
  const [dialog, setDialog] = useState<DestinationDialogState>();

  const { data: queryData, startPolling, stopPolling } = useQuery(ReadBackupDestinationsDocument, {
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });
  const { data: subData } = useSubscription(SubscribeBackupDestinationsDocument, {
    onComplete() {
      stopPolling();
    },
    onError() {
      startPolling(5000);
    },
  });
  const data: ReadBackupDestinationsQuery | undefined =
    (subData as unknown as ReadBackupDestinationsQuery) ?? queryData;

  const destinations = useMemo(() => {
    const base = filter(data?.readBackupDestinations ?? [], search, ["name", "type", "output"]);
    const sorted = [...base].sort((a, b) => {
      const av = a[sort.field] as any;
      const bv = b[sort.field] as any;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sort.direction === "Asc" ? -1 : 1;
      if (av > bv) return sort.direction === "Asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data?.readBackupDestinations, search, sort]);

  return (
    <div className={styles.table}>
      <CreateDestination
        open={dialog?.type === DialogType.Create}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Create }) : setDialog(undefined))}
        icon={route?.data?.icon}
      />
      <UpdateDestination
        open={dialog?.type === DialogType.Update}
        setOpen={(v) =>
          v ? setDialog({ type: DialogType.Update, destination: dialog?.destination }) : setDialog(undefined)
        }
        icon={route?.data?.icon}
        destination={dialog?.destination}
      />
      <DeleteDestination
        open={dialog?.type === DialogType.Delete}
        setOpen={(v) =>
          v ? setDialog({ type: DialogType.Delete, destination: dialog?.destination }) : setDialog(undefined)
        }
        icon={route?.data?.icon}
        destination={dialog?.destination}
      />
      <ControlGroup>
        <div className={styles.spacer} />
        <Search value={search} onValueChange={setSearch} />
        <Button icon={IconNames.ADD} intent={Intent.PRIMARY} onClick={() => setDialog({ type: DialogType.Create })}>
          Add Destination
        </Button>
      </ControlGroup>
      <Table
        rowKey="id"
        rows={destinations}
        columns={[
          { field: "order", label: "Order" },
          { field: "name", label: "Name", type: "term" },
          { field: "type", label: "Type", type: "term" },
          { field: "output", label: "Output", type: "term" },
          {
            field: "enabled",
            label: "Enabled",
            renderer: (_c, _r, v) => <Tag intent={v ? Intent.SUCCESS : Intent.NONE}>{v ? "Enabled" : "Disabled"}</Tag>,
          },
          { field: "updatedAt", label: "Updated", type: "date" },
        ]}
        actions={{
          values: [
            { id: "update", icon: IconNames.EDIT, intent: Intent.PRIMARY },
            { id: "delete", icon: IconNames.TRASH, intent: Intent.DANGER },
          ],
          onClick: (id, row) => {
            switch (id) {
              case "update":
                setDialog({ type: DialogType.Update, destination: row });
                return;
              case "delete":
                setDialog({ type: DialogType.Delete, destination: row });
                return;
            }
          },
        }}
        sort={sort}
        setSort={setSort}
      />
    </div>
  );
}

function RunsTab() {
  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    field: keyof Term<BackupRun>;
    direction: "Asc" | "Desc";
  }>({ field: "createdAt", direction: "Desc" });
  const [dialog, setDialog] = useState<RunDialogState>();

  const { data: queryData, startPolling, stopPolling } = useQuery(ReadBackupRunsDocument, {
    variables: { take: 100 },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });
  const { data: subData } = useSubscription(SubscribeBackupRunsDocument, {
    variables: { take: 100 },
    onComplete() {
      stopPolling();
    },
    onError() {
      startPolling(5000);
    },
  });
  const data: ReadBackupRunsQuery | undefined = (subData as unknown as ReadBackupRunsQuery) ?? queryData;

  const runs = useMemo(() => {
    const base = filter(data?.readBackupRuns ?? [], search, ["status", "trigger", "keyFingerprint", "archivePath"]);
    const sorted = [...base].sort((a, b) => {
      const av = a[sort.field] as any;
      const bv = b[sort.field] as any;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sort.direction === "Asc" ? -1 : 1;
      if (av > bv) return sort.direction === "Asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data?.readBackupRuns, search, sort]);

  return (
    <div className={styles.table}>
      <TriggerRun
        open={dialog?.type === DialogType.Create}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Create }) : setDialog(undefined))}
        icon={route?.data?.icon}
      />
      <ViewRun
        open={dialog?.type === DialogType.View}
        setOpen={(v) => (v ? setDialog({ type: DialogType.View, run: dialog?.run }) : setDialog(undefined))}
        icon={route?.data?.icon}
        run={dialog?.run}
      />
      <CancelRun
        open={dialog?.type === DialogType.Confirm}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Confirm, run: dialog?.run }) : setDialog(undefined))}
        icon={route?.data?.icon}
        run={dialog?.run}
      />
      <ControlGroup>
        <div className={styles.spacer} />
        <Search value={search} onValueChange={setSearch} />
        <Button icon={IconNames.PLAY} intent={Intent.PRIMARY} onClick={() => setDialog({ type: DialogType.Create })}>
          Run Now
        </Button>
      </ControlGroup>
      <Table
        rowKey="id"
        rows={runs}
        columns={[
          {
            field: "status",
            label: "Status",
            // Table renderers receive the row INDEX, not the row itself,
            // so look up the row to read `archiveAvailability` alongside
            // the run status.
            renderer: (_c, rowIdx) => {
              const row = runs[rowIdx];
              return <RunStatusTag status={row?.status} archiveAvailability={row?.archiveAvailability} />;
            },
          },
          { field: "trigger", label: "Trigger", type: "term" },
          {
            field: "archiveBytes",
            label: "Size",
            renderer: (_c, _r, v) => <>{formatBytes(v)}</>,
          },
          { field: "keyFingerprint", label: "Key", type: "term" },
          { field: "startedAt", label: "Started", type: "date" },
          { field: "finishedAt", label: "Finished", type: "date" },
          { field: "createdAt", label: "Created", type: "date" },
        ]}
        actions={{
          values: [
            { id: "view", icon: IconNames.EYE_OPEN, intent: Intent.PRIMARY },
            { id: "cancel", icon: IconNames.STOP, intent: Intent.WARNING },
          ],
          onClick: (id, row) => {
            switch (id) {
              case "view":
                setDialog({ type: DialogType.View, run: row });
                return;
              case "cancel":
                setDialog({ type: DialogType.Confirm, run: row });
                return;
            }
          },
          isDisabled: (id, row) => id === "cancel" && row.status !== "Running" && row.status !== "Queued",
        }}
        sort={sort}
        setSort={setSort}
      />
    </div>
  );
}

function KeysTab() {
  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);

  const [dialog, setDialog] = useState<KeyDialogState>();

  const { data: queryData, startPolling, stopPolling } = useQuery(ReadBackupKeysDocument, {
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });
  const { data: subData } = useSubscription(SubscribeBackupKeysDocument, {
    onComplete() {
      stopPolling();
    },
    onError() {
      startPolling(5000);
    },
  });
  const data: ReadBackupKeysQuery | undefined = (subData as unknown as ReadBackupKeysQuery) ?? queryData;

  const keys = useMemo(() => {
    const base = [...(data?.readBackupKeys ?? [])];
    base.sort((a, b) => {
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      const ac = a.createdAt ?? "";
      const bc = b.createdAt ?? "";
      return ac < bc ? 1 : ac > bc ? -1 : 0;
    });
    return base;
  }, [data?.readBackupKeys]);

  const activeUnacknowledged = keys.find((k) => k.active && !k.acknowledged);

  return (
    <div className={styles.table}>
      <RotateKey
        open={dialog?.type === DialogType.Create}
        setOpen={(v) => (v ? setDialog({ type: DialogType.Create }) : setDialog(undefined))}
        icon={route?.data?.icon}
      />
      <AcknowledgeKey
        open={dialog?.type === DialogType.Confirm}
        setOpen={(v) =>
          v ? setDialog({ type: DialogType.Confirm, backupKey: dialog?.backupKey }) : setDialog(undefined)
        }
        icon={route?.data?.icon}
        backupKey={dialog?.backupKey}
      />
      <DownloadPrivateKey
        open={dialog?.type === DialogType.View}
        setOpen={(v) => (v ? setDialog({ type: DialogType.View, backupKey: dialog?.backupKey }) : setDialog(undefined))}
        icon={route?.data?.icon}
        backupKey={dialog?.backupKey}
      />
      {activeUnacknowledged && (
        <Callout intent={Intent.WARNING} title="Active backup key requires acknowledgement" icon={IconNames.KEY}>
          The active backup key with fingerprint <code>{activeUnacknowledged.fingerprint}</code> has not been
          acknowledged. New backups will continue to encrypt with this key, but restore requires the corresponding
          private key to be secured offline.
        </Callout>
      )}
      <ControlGroup>
        <div className={styles.spacer} />
        <Button icon={IconNames.REFRESH} intent={Intent.WARNING} onClick={() => setDialog({ type: DialogType.Create })}>
          Rotate Key
        </Button>
      </ControlGroup>
      <Table
        rowKey="id"
        rows={keys}
        columns={[
          {
            field: "active",
            label: "Active",
            renderer: (_c, _r, v) => <Tag intent={v ? Intent.SUCCESS : Intent.NONE}>{v ? "Active" : "Retired"}</Tag>,
          },
          { field: "algorithm", label: "Algorithm", type: "term" },
          { field: "fingerprint", label: "Fingerprint", type: "term" },
          {
            field: "acknowledged",
            label: "Acknowledged",
            renderer: (_c, _r, v) => <Tag intent={v ? Intent.SUCCESS : Intent.WARNING}>{v ? "Yes" : "No"}</Tag>,
          },
          { field: "rotatedAt", label: "Rotated", type: "date" },
          { field: "createdAt", label: "Created", type: "date" },
        ]}
        actions={{
          values: [
            { id: "acknowledge", icon: IconNames.TICK, intent: Intent.PRIMARY },
            { id: "download", icon: IconNames.DOWNLOAD, intent: Intent.PRIMARY },
          ],
          onClick: (id, row) => {
            switch (id) {
              case "acknowledge":
                setDialog({ type: DialogType.Confirm, backupKey: row });
                return;
              case "download":
                setDialog({ type: DialogType.View, backupKey: row });
                return;
            }
          },
          isDisabled: (id, row) => id === "acknowledge" && !!row.acknowledged,
        }}
      />
    </div>
  );
}

export default function Page() {
  const [tab, setTab] = useState<TabId>("policy");

  return (
    <Tabs className={styles.tabs} selectedTabId={tab} onChange={(t) => setTab(t)}>
      <Tab id="policy" title="Policy" panel={<PolicyTab />} />
      <Tab id="destinations" title="Destinations" panel={<DestinationsTab />} />
      <Tab id="runs" title="Runs" panel={<RunsTab />} />
      <Tab id="keys" title="Keys" panel={<KeysTab />} />
      <TabsExpander />
    </Tabs>
  );
}
