"use client";

import { HistorianReplicationInfoDocument, HistorianReplicationInfoQuery } from "@/graphql-codegen/graphql";
import {
  Button,
  Callout,
  Card,
  Elevation,
  H3,
  H4,
  H5,
  Intent,
  NonIdealState,
  Radio,
  RadioGroup,
  Spinner,
  Tab,
  Tabs,
  ControlGroup,
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { useQuery } from "@apollo/client";
import { useContext, useState, useMemo } from "react";
import { NotificationContext, NotificationType } from "../components/providers";
import { Table, Search, Paging } from "../components/common";
import { filter, Term } from "@/utils/client";
import styles from "./page.module.scss";
import { orderBy } from "@local/common/dist/utils/lodash";

export default function HistorianPage() {
  const { createNotification } = useContext(NotificationContext);

  // State for Unit Status table
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    field:
      | keyof Term<
          NonNullable<
            NonNullable<HistorianReplicationInfoQuery["historianReplicationInfo"]>["systemPublishingStatus"]
          >[0]
        >
      | "topic";
    direction: "Asc" | "Desc";
  }>({
    field: "lastPublished",
    direction: "Desc",
  });
  const [paging, setPaging] = useState({ take: 20, skip: 0 });

  const { data, loading, error, refetch } = useQuery(HistorianReplicationInfoDocument, {
    fetchPolicy: "cache-and-network",
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });
  const [activeTab, setActiveTab] = useState("publisher");
  // Subscriber Setup tab: which path (SQL vs shell) and, for shell, which OS.
  const [setupPath, setSetupPath] = useState<"sql" | "shell">("sql");
  const [setupShell, setSetupShell] = useState<"bash" | "powershell">("bash");

  // Memoized filtered unit data using the filter utility
  const filteredUnits = useMemo(() => {
    const units = (data?.historianReplicationInfo?.systemPublishingStatus ?? []).map((v) => ({
      topic: `${v.campus}/${v.building}/${v.system}/${v.metric}`,
      ...v,
    }));
    // Use the filter utility to search across specified fields
    return orderBy(
      filter(units, search, ["campus", "building", "system", "metric", "status"]),
      [sort.field],
      [sort.direction.toLowerCase() as "asc" | "desc"],
    );
  }, [data, search, sort]);

  // Paginated data
  const paginatedUnits = useMemo(() => {
    return filteredUnits.slice(paging.skip, paging.skip + paging.take);
  }, [filteredUnits, paging]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      createNotification?.("Copied to clipboard", NotificationType.Notification);
    } catch (err) {
      createNotification?.("Failed to copy text", NotificationType.Error);
      console.error("Failed to copy text:", err);
    }
  };

  // Trigger a browser download of arbitrary text content as a named file.
  const downloadAs = (text: string, filename: string, mime = "text/plain") => {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Wrap a SQL block into a shell command that runs it via psql against
  // either the subscriber or the publisher. Same env-var contract as the
  // Subscriber Setup tab so operators only set them once.
  const sqlToShell = (sql: string, target: "sub" | "pub", shell: "bash" | "powershell"): string => {
    const H = target === "sub" ? "SUB_HOST" : "PUB_HOST";
    const P = target === "sub" ? "SUB_PORT" : "PUB_PORT";
    const U = target === "sub" ? "SUB_USER" : "PUB_USER";
    const DB = target === "sub" ? "$SUB_DB" : "historian";
    const PW = target === "sub" ? "SUB_PASSWORD" : "PUB_PASSWORD";
    if (shell === "bash") {
      return `PGPASSWORD="$${PW}" psql -h "$${H}" -p "$${P}" -U "$${U}" -d "${DB}" \\
  -v ON_ERROR_STOP=1 <<'SQL'
${sql}
SQL`;
    }
    // PowerShell
    const pwDb = target === "sub" ? "$env:SUB_DB" : "historian";
    return `$env:PGPASSWORD = $env:${PW}
@'
${sql}
'@ | & psql -h $env:${H} -p $env:${P} -U $env:${U} -d ${pwDb} -v ON_ERROR_STOP=1
Remove-Item Env:PGPASSWORD`;
  };

  // Static SQL used by the Subscription Removal tab (matches the copy-button
  // strings from before).
  const dropSubscriptionSql = `-- On subscriber: Drop the subscription
DROP SUBSCRIPTION IF EXISTS historian_sub;`;
  const dropSlotSql = `-- On publisher: Drop the replication slot
SELECT pg_drop_replication_slot('historian_sub_slot');`;
  const dropTablesSql = `-- On subscriber: Drop replicated tables
DROP TABLE IF EXISTS data CASCADE;
DROP TABLE IF EXISTS topics CASCADE;`;
  const dropBackfillSql = `-- On subscriber: Drop the backfill schema
-- Safe to keep between backfill sessions; drop only if you don't intend to
-- re-run backfill from this subscriber. Removes: backfill.config, backfill.progress,
-- backfill.pending view, and the run_backfill procedure.
DROP SCHEMA IF EXISTS backfill CASCADE;`;
  const dropMigrationStageSql = `-- On publisher: Drop the migration staging schema
-- Only relevant if migrate-historian-data.sh ever ran against this historian
-- and left the staging schema behind. Safe to keep; safe to drop after the
-- migration is verified.
DROP SCHEMA IF EXISTS migration_stage CASCADE;`;

  // Env-var preambles for tabs that use shell forms — bash and PowerShell
  // versions. Publisher preambles reference `hostname` lazily via a factory
  // so this declaration doesn't require `hostname` to exist yet.
  const subShPreamble = `# Subscriber connection env vars — set once, reuse across all cards.
export SUB_HOST=YOUR_SUBSCRIBER_HOSTNAME
export SUB_PORT=5432
export SUB_USER=YOUR_SUBSCRIBER_USER
export SUB_DB=historian
export SUB_PASSWORD=YOUR_SUBSCRIBER_PASSWORD`;
  const subPs1Preamble = `# Subscriber connection env vars — set once, reuse across all cards.
$env:SUB_HOST     = "YOUR_SUBSCRIBER_HOSTNAME"
$env:SUB_PORT     = "5432"
$env:SUB_USER     = "YOUR_SUBSCRIBER_USER"
$env:SUB_DB       = "historian"
$env:SUB_PASSWORD = "YOUR_SUBSCRIBER_PASSWORD"`;
  const pubShPreamble = (h: string) => `# Publisher connection env vars.
export PUB_HOST=${h}
export PUB_PORT=6543
export PUB_USER=replicator
export PUB_PASSWORD=YOUR_REPLICATOR_PASSWORD`;
  const pubPs1Preamble = (h: string) => `# Publisher connection env vars.
$env:PUB_HOST     = "${h}"
$env:PUB_PORT     = "6543"
$env:PUB_USER     = "replicator"
$env:PUB_PASSWORD = "YOUR_REPLICATOR_PASSWORD"`;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <Spinner size={50} />
      </div>
    );
  }

  if (error) {
    return <NonIdealState icon={IconNames.ERROR} title="Error Loading Replication Info" description={error.message} />;
  }

  if (!data?.historianReplicationInfo) {
    return (
      <NonIdealState
        icon={IconNames.DATABASE}
        title="No Replication Info Available"
        description="Unable to fetch historian replication information"
      />
    );
  }

  const { publisherInfo, subscriberSetupSql, monitoringSql, systemPublishingStatus } = data.historianReplicationInfo;

  // Replace {{HOSTNAME}} placeholder in every subscriber-setup string with the
  // publisher's public hostname (this browser's — the /historian page is
  // served from the publisher, so this matches).
  const hostname = typeof window !== "undefined" ? window.location.hostname : "YOUR_HOSTNAME";
  const sub = subscriberSetupSql;
  const sub_ = (s: string | null | undefined) => (s ?? "").replace(/\{\{HOSTNAME\}\}/g, hostname);

  // Path A (SQL) card contents
  const sqlCards = [
    { title: "1. Create tables on subscriber", content: sub_(sub.createTablesSql) },
    { title: "2. Add primary keys", content: sub_(sub.createConstraintsSql) },
    { title: "3. Add indexes", content: sub_(sub.createIndexesSql) },
    { title: "4. Create subscription", content: sub_(sub.createSubscriptionSql) },
    { title: "5. Backfill historical rows", content: sub_(sub.backfillProcedureSql) },
  ];

  // Path B (shell) card contents — a per-OS view.
  const shellIsBash = setupShell === "bash";
  const shellExt = shellIsBash ? "sh" : "ps1";
  const shellMime = shellIsBash ? "application/x-sh" : "application/x-powershell";
  const shellCards = [
    {
      title: "1. Create tables on subscriber",
      content: sub_(shellIsBash ? sub.createTablesCmdSh : sub.createTablesCmdPs1),
      file: `step-1-create-tables.${shellExt}`,
    },
    {
      title: "2. Add primary keys",
      content: sub_(shellIsBash ? sub.createConstraintsCmdSh : sub.createConstraintsCmdPs1),
      file: `step-2-primary-keys.${shellExt}`,
    },
    {
      title: "3. Add indexes",
      content: sub_(shellIsBash ? sub.createIndexesCmdSh : sub.createIndexesCmdPs1),
      file: `step-3-indexes.${shellExt}`,
    },
    {
      title: "4. Create subscription",
      content: sub_(shellIsBash ? sub.createSubscriptionCmdSh : sub.createSubscriptionCmdPs1),
      file: `step-4-subscription.${shellExt}`,
    },
    {
      title: "5. Backfill historical rows (full standalone script)",
      content: sub_(shellIsBash ? sub.linuxScript : sub.windowsScript),
      file: `subscribe-historian.${shellExt}`,
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <H3>Historian Database Replication</H3>
      <p className={styles.pageDescription}>
        This page provides auto-generated SQL and information for setting up historian database replication to remote
        offsite locations.
      </p>

      <Tabs
        id="replication-tabs"
        selectedTabId={activeTab}
        onChange={(newTabId) => setActiveTab(newTabId as string)}
        large
      >
        {/* Publisher Info Tab */}
        <Tab
          id="publisher"
          title="Publisher Info"
          panel={
            <div className={styles.tabPanel}>
              <Card elevation={Elevation.TWO} className={styles.cardSpacing}>
                <H4>Publication Status</H4>
                <table className={`bp5-html-table bp5-html-table-striped ${styles.fullWidthTable}`}>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Publication Name:</strong>
                      </td>
                      <td>{publisherInfo.publicationName}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Active Connections:</strong>
                      </td>
                      <td>{publisherInfo.activeConnections}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Published Tables:</strong>
                      </td>
                      <td>{publisherInfo.publishedTables?.join(", ") || "None"}</td>
                    </tr>
                  </tbody>
                </table>
              </Card>

              {publisherInfo.replicationSlots && publisherInfo.replicationSlots.length > 0 && (
                <Card elevation={Elevation.TWO}>
                  <H4>Replication Slots</H4>
                  <table className={`bp5-html-table bp5-html-table-striped ${styles.fullWidthTable}`}>
                    <thead>
                      <tr>
                        <th>Slot Name</th>
                        <th>Plugin</th>
                        <th>Type</th>
                        <th>Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {publisherInfo.replicationSlots.map((slot) => (
                        <tr key={slot.slotName}>
                          <td>{slot.slotName}</td>
                          <td>{slot.plugin}</td>
                          <td>{slot.slotType}</td>
                          <td>
                            <span className={slot.active ? "bp5-tag bp5-intent-success" : "bp5-tag bp5-intent-warning"}>
                              {slot.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}

              {(!publisherInfo.replicationSlots || publisherInfo.replicationSlots.length === 0) && (
                <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN}>
                  No replication slots found. Slots will be created automatically when a subscriber connects.
                </Callout>
              )}
            </div>
          }
        />

        {/* Historian Status Tab */}
        <Tab
          id="historian-status"
          title="Historian Status"
          panel={
            <div className={styles.tabPanel}>
              <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} style={{ marginBottom: "20px" }}>
                Monitor which units are actively publishing data to the historian database. Status updates every time
                this page is loaded.
              </Callout>

              {systemPublishingStatus && systemPublishingStatus.length > 0 ? (
                <>
                  <ControlGroup style={{ marginBottom: "10px" }}>
                    <div style={{ flex: 1 }} />
                    <Button loading={loading} icon={IconNames.REFRESH} onClick={() => refetch()} />
                    <Search
                      value={search}
                      onValueChange={setSearch}
                      placeholder="Search campus, building, system, or status..."
                    />
                  </ControlGroup>

                  <Card elevation={Elevation.TWO}>
                    <Table
                      rowKey="topic"
                      rows={paginatedUnits}
                      columns={[
                        { field: "campus", label: "Campus", type: "term" },
                        { field: "building", label: "Building", type: "term" },
                        {
                          field: "system",
                          label: "System",
                          type: "term",
                        },
                        {
                          field: "metric",
                          label: "Metric",
                          type: "term",
                        },
                        { field: "lastPublished", label: "Last Published", type: "date" },
                        {
                          field: "minutesAgo",
                          label: "Time Ago",
                          renderer: (col, row, value) => `${value} minute${value !== 1 ? "s" : ""} ago`,
                        },
                        {
                          field: "status",
                          label: "Status",
                          renderer: (col, row, value) => {
                            const statusIntent =
                              value === "active" ? Intent.SUCCESS : value === "stale" ? Intent.WARNING : Intent.DANGER;

                            const statusText = value === "active" ? "Active" : value === "stale" ? "Stale" : "Inactive";

                            return (
                              <span
                                className={`bp5-tag bp5-intent-${statusIntent === Intent.SUCCESS ? "success" : statusIntent === Intent.WARNING ? "warning" : "danger"}`}
                              >
                                {statusText}
                              </span>
                            );
                          },
                        },
                      ]}
                      sort={sort}
                      setSort={setSort}
                    />
                    <div style={{ marginTop: "15px", fontSize: "13px", color: "#5C7080" }}>
                      <strong>Status Legend:</strong>
                      <ul style={{ marginTop: "5px", marginBottom: "0" }}>
                        <li>
                          <strong>Active:</strong> Data received within the last 5 minutes
                        </li>
                        <li>
                          <strong>Stale:</strong> Data received 5-60 minutes ago
                        </li>
                        <li>
                          <strong>Inactive:</strong> No data received in over 60 minutes
                        </li>
                      </ul>
                    </div>
                  </Card>

                  <ControlGroup style={{ marginTop: "10px" }}>
                    <div style={{ flex: 1 }} />
                    <Paging length={filteredUnits.length} paging={paging} setPaging={setPaging} />
                  </ControlGroup>
                </>
              ) : (
                <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN}>
                  No system publishing data available. Systems will appear here once they start publishing data to the
                  historian database.
                </Callout>
              )}
            </div>
          }
        />

        {/* Subscriber Setup Tab */}
        <Tab
          id="subscriber"
          title="Subscriber Setup"
          panel={
            <div className={styles.tabPanel}>
              <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} className={styles.calloutSpacing}>
                Choose one. <strong>Pure SQL</strong> works entirely within pgAdmin / psql attached to your
                subscriber&apos;s PostgreSQL 16+ — no other tools needed.{" "}
                <strong>Shell / PowerShell commands</strong> run on any machine with <code>psql</code> and{" "}
                <code>pg_dump</code> on PATH (the subscriber&apos;s host, an admin box, wherever). Every step
                exists in both forms; whichever path you pick, walk the same five cards below.
              </Callout>

              <Card elevation={Elevation.TWO} className={styles.cardSpacing}>
                <RadioGroup
                  label="Path"
                  inline
                  selectedValue={setupPath}
                  onChange={(e) => setSetupPath((e.target as HTMLInputElement).value as "sql" | "shell")}
                >
                  <Radio label="Pure SQL (pgAdmin / psql)" value="sql" />
                  <Radio label="Shell commands (psql on PATH)" value="shell" />
                </RadioGroup>
                {setupPath === "shell" && (
                  <RadioGroup
                    label="Operating system"
                    inline
                    selectedValue={setupShell}
                    onChange={(e) =>
                      setSetupShell((e.target as HTMLInputElement).value as "bash" | "powershell")
                    }
                  >
                    <Radio label="Linux / macOS (bash)" value="bash" />
                    <Radio label="Windows (PowerShell)" value="powershell" />
                  </RadioGroup>
                )}
              </Card>

              {setupPath === "sql"
                ? sqlCards.map((card, i) => (
                    <Card key={`sql-${i}`} elevation={Elevation.TWO} className={styles.cardSpacing}>
                      <div className={styles.flexHeader}>
                        <H5>{card.title}</H5>
                        <Button
                          icon={IconNames.DUPLICATE}
                          text="Copy"
                          onClick={() => copyToClipboard(card.content)}
                          small
                        />
                      </div>
                      {i === 3 && (
                        <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN} style={{ marginBottom: "10px" }}>
                          Replace <code>YOUR_REPLICATOR_PASSWORD</code>. Hostname and port are pre-filled.{" "}
                          <strong>copy_data=false</strong> streams from now — Card 5 fills historical rows.
                        </Callout>
                      )}
                      {i === 4 && (
                        <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} style={{ marginBottom: "10px" }}>
                          Requires the <code>dblink</code> extension (ships with any standard PostgreSQL install as
                          part of <code>postgres-contrib</code>). Per-chunk <code>COMMIT</code> means cellular
                          disconnects only lose the in-flight chunk — <strong>re-CALL</strong> to resume from the
                          first incomplete <code>chunk_start</code>. Idempotent via{" "}
                          <code>ON CONFLICT (topic_id, ts) DO NOTHING</code>. Edit the <code>start_ts</code> and
                          password before running.
                        </Callout>
                      )}
                      <pre className={styles.codeBlockWithMaxHeight}>{card.content}</pre>
                    </Card>
                  ))
                : shellCards.map((card, i) => (
                    <Card key={`sh-${i}`} elevation={Elevation.TWO} className={styles.cardSpacing}>
                      <div className={styles.flexHeader}>
                        <H5>{card.title}</H5>
                        <ControlGroup>
                          <Button
                            icon={IconNames.DUPLICATE}
                            text="Copy"
                            onClick={() => copyToClipboard(card.content)}
                            small
                          />
                          <Button
                            icon={IconNames.DOWNLOAD}
                            text={`Download .${shellExt}`}
                            onClick={() => downloadAs(card.content, card.file, shellMime)}
                            small
                          />
                        </ControlGroup>
                      </div>
                      {i === 0 && (
                        <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} style={{ marginBottom: "10px" }}>
                          Requires <code>psql</code> and <code>pg_dump</code> on PATH. Set the env vars at the top
                          (they&apos;re reused across cards), then paste the command. Same env-var names in bash and
                          PowerShell — swap OS on the selector above.
                        </Callout>
                      )}
                      {i === 4 && (
                        <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} style={{ marginBottom: "10px" }}>
                          Full standalone script. Encapsulates all five steps plus a resumable chunked backfill
                          (checkpointed per chunk in <code>public.backfill_progress</code>). Safe over cellular
                          links; safe to interrupt (Ctrl-C) and re-run. Download it and run{" "}
                          <code>./{card.file} --help</code>.
                        </Callout>
                      )}
                      <pre className={styles.codeBlockWithMaxHeight}>{card.content}</pre>
                    </Card>
                  ))}
            </div>
          }
        />

        {/* Subscription Removal Tab */}
        <Tab
          id="removal"
          title="Subscription Removal"
          panel={
            <div className={styles.tabPanel}>
              <Callout intent={Intent.DANGER} icon={IconNames.WARNING_SIGN} style={{ marginBottom: "20px" }}>
                <strong>Warning:</strong> These commands will remove the subscription and optionally delete replicated
                data. Use with caution as these operations are <strong>destructive</strong> and cannot be undone.
              </Callout>

              <Card elevation={Elevation.TWO} className={styles.cardSpacing}>
                <RadioGroup
                  label="Path"
                  inline
                  selectedValue={setupPath}
                  onChange={(e) => setSetupPath((e.target as HTMLInputElement).value as "sql" | "shell")}
                >
                  <Radio label="Pure SQL (pgAdmin / psql)" value="sql" />
                  <Radio label="Shell commands (psql on PATH)" value="shell" />
                </RadioGroup>
                {setupPath === "shell" && (
                  <RadioGroup
                    label="Operating system"
                    inline
                    selectedValue={setupShell}
                    onChange={(e) =>
                      setSetupShell((e.target as HTMLInputElement).value as "bash" | "powershell")
                    }
                  >
                    <Radio label="Linux / macOS (bash)" value="bash" />
                    <Radio label="Windows (PowerShell)" value="powershell" />
                  </RadioGroup>
                )}
              </Card>

              {setupPath === "shell" && (
                <Card elevation={Elevation.TWO} className={styles.cardSpacing}>
                  <div className={styles.flexHeader}>
                    <H5>Env-var setup (paste once)</H5>
                    <ControlGroup>
                      <Button
                        icon={IconNames.DUPLICATE}
                        text="Copy"
                        onClick={() =>
                          copyToClipboard(
                            (shellIsBash ? subShPreamble : subPs1Preamble) +
                              "\n\n" +
                              (shellIsBash ? pubShPreamble(hostname) : pubPs1Preamble(hostname)),
                          )
                        }
                        small
                      />
                    </ControlGroup>
                  </div>
                  <pre className={styles.codeBlockWithMaxHeight}>
                    {(shellIsBash ? subShPreamble : subPs1Preamble) +
                      "\n\n" +
                      (shellIsBash ? pubShPreamble(hostname) : pubPs1Preamble(hostname))}
                  </pre>
                </Card>
              )}

              {[
                { title: "Drop Subscription", target: "sub" as const, sql: dropSubscriptionSql, danger: false,
                  hint: "Run on the subscriber database to remove the subscription." },
                { title: "Drop Replication Slot (Publisher)", target: "pub" as const, sql: dropSlotSql, danger: false,
                  hint: "Optional. Run on the publisher database if the slot was not automatically cleaned up." },
                { title: "Drop Replicated Tables", target: "sub" as const, sql: dropTablesSql, danger: true,
                  hint: "Optional. Deletes all replicated data on the subscriber — irreversible." },
                { title: "Drop Backfill Schema (Subscriber)", target: "sub" as const, sql: dropBackfillSql, danger: false,
                  hint: "Optional. Removes backfill bookkeeping (config, progress, staging). Safe to keep between backfill sessions." },
                { title: "Drop Migration Staging (Publisher)", target: "pub" as const, sql: dropMigrationStageSql, danger: false,
                  hint: "Optional. Only if migrate-historian-data.sh ever ran against this historian and left the staging schema behind." },
              ].map((card, i) => {
                const content = setupPath === "sql" ? card.sql : sqlToShell(card.sql, card.target, setupShell);
                const file = `${card.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${shellExt}`;
                return (
                  <Card key={`rm-${i}`} elevation={Elevation.TWO} className={styles.cardSpacing}>
                    <div className={styles.flexHeader}>
                      <H5>{card.title}</H5>
                      <ControlGroup>
                        <Button icon={IconNames.DUPLICATE} text="Copy" onClick={() => copyToClipboard(content)} small />
                        {setupPath === "shell" && (
                          <Button
                            icon={IconNames.DOWNLOAD}
                            text={`Download .${shellExt}`}
                            onClick={() => downloadAs(content, file, shellMime)}
                            small
                          />
                        )}
                      </ControlGroup>
                    </div>
                    {card.danger && (
                      <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN} style={{ marginBottom: "10px" }}>
                        <strong>Caution:</strong> {card.hint}
                      </Callout>
                    )}
                    {!card.danger && (
                      <p style={{ marginBottom: "10px", fontSize: "13px" }}>{card.hint}</p>
                    )}
                    <pre className={styles.codeBlockWithMaxHeight}>{content}</pre>
                  </Card>
                );
              })}
            </div>
          }
        />

        {/* Monitoring Tab */}
        <Tab
          id="monitoring"
          title="Monitoring"
          panel={
            <div className={styles.tabPanel}>
              <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} style={{ marginBottom: "20px" }}>
                Use these queries to monitor replication health and troubleshoot issues. All four run against the
                subscriber.
              </Callout>

              <Card elevation={Elevation.TWO} className={styles.cardSpacing}>
                <RadioGroup
                  label="Path"
                  inline
                  selectedValue={setupPath}
                  onChange={(e) => setSetupPath((e.target as HTMLInputElement).value as "sql" | "shell")}
                >
                  <Radio label="Pure SQL (pgAdmin / psql)" value="sql" />
                  <Radio label="Shell commands (psql on PATH)" value="shell" />
                </RadioGroup>
                {setupPath === "shell" && (
                  <RadioGroup
                    label="Operating system"
                    inline
                    selectedValue={setupShell}
                    onChange={(e) =>
                      setSetupShell((e.target as HTMLInputElement).value as "bash" | "powershell")
                    }
                  >
                    <Radio label="Linux / macOS (bash)" value="bash" />
                    <Radio label="Windows (PowerShell)" value="powershell" />
                  </RadioGroup>
                )}
              </Card>

              {setupPath === "shell" && (
                <Card elevation={Elevation.TWO} className={styles.cardSpacing}>
                  <div className={styles.flexHeader}>
                    <H5>Env-var setup (paste once)</H5>
                    <Button
                      icon={IconNames.DUPLICATE}
                      text="Copy"
                      onClick={() => copyToClipboard(shellIsBash ? subShPreamble : subPs1Preamble)}
                      small
                    />
                  </div>
                  <pre className={styles.codeBlockWithMaxHeight}>
                    {shellIsBash ? subShPreamble : subPs1Preamble}
                  </pre>
                </Card>
              )}

              {[
                { title: "Check Schema Match", sql: monitoringSql.checkSchemaMatchSql },
                { title: "Check Replication Lag", sql: monitoringSql.checkReplicationLagSql },
                { title: "Check Subscription Status", sql: monitoringSql.checkSubscriptionStatusSql },
                { title: "Check Sync Errors", sql: monitoringSql.checkSyncErrorsSql },
              ].map((card, i) => {
                const content = setupPath === "sql" ? card.sql : sqlToShell(card.sql, "sub", setupShell);
                const file = `${card.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${shellExt}`;
                return (
                  <Card key={`mon-${i}`} elevation={Elevation.TWO} className={styles.cardSpacing}>
                    <div className={styles.flexHeader}>
                      <H5>{card.title}</H5>
                      <ControlGroup>
                        <Button icon={IconNames.DUPLICATE} text="Copy" onClick={() => copyToClipboard(content)} small />
                        {setupPath === "shell" && (
                          <Button
                            icon={IconNames.DOWNLOAD}
                            text={`Download .${shellExt}`}
                            onClick={() => downloadAs(content, file, shellMime)}
                            small
                          />
                        )}
                      </ControlGroup>
                    </div>
                    <pre className={styles.codeBlockWithMaxHeight}>{content}</pre>
                  </Card>
                );
              })}
            </div>
          }
        />
      </Tabs>
    </div>
  );
}
