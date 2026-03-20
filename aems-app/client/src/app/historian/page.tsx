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
import { filter } from "@/utils/client";
import styles from "./page.module.scss";

export default function HistorianPage() {
  const { createNotification } = useContext(NotificationContext);
  const { data, loading, error, refetch } = useQuery(HistorianReplicationInfoDocument, {
    fetchPolicy: "cache-and-network",
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });
  const [activeTab, setActiveTab] = useState("publisher");

  // State for Unit Status table
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    field: "campus" | "building" | "system" | "metric" | "lastPublished" | "minutesAgo" | "status" | "terms" | "topic";
    direction: "Asc" | "Desc";
  }>({
    field: "lastPublished",
    direction: "Desc",
  });
  const [paging, setPaging] = useState({ take: 20, skip: 0 });

  // Memoized filtered unit data using the filter utility
  const filteredUnits = useMemo(() => {
    const units = (data?.historianReplicationInfo?.systemPublishingStatus ?? []).map((v) => ({
      topic: `${v.campus}/${v.building}/${v.system}/${v.metric}`,
      ...v,
    }));
    // Use the filter utility to search across specified fields
    return filter(units, search, ["campus", "building", "system", "metric", "status"]);
  }, [data, search]);

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

  // Replace hostname placeholder with current browser hostname
  const hostname = typeof window !== "undefined" ? window.location.hostname : "YOUR_HOSTNAME";
  const finalSubscriptionTemplate = subscriberSetupSql.createSubscriptionTemplate.replace("{{HOSTNAME}}", hostname);

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

        {/* Subscriber Setup Tab */}
        <Tab
          id="subscriber"
          title="Subscriber Setup"
          panel={
            <div className={styles.tabPanel}>
              <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} className={styles.calloutSpacing}>
                Run these SQL commands on your <strong>subscriber database</strong> to set up replication.
              </Callout>

              <Card elevation={Elevation.TWO} className={styles.cardSpacing}>
                <div className={styles.flexHeader}>
                  <H5>1. Create Tables</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() => copyToClipboard(subscriberSetupSql.createTablesSql)}
                    small
                  />
                </div>
                <pre className={styles.codeBlockWithMaxHeight}>{subscriberSetupSql.createTablesSql}</pre>
              </Card>

              <Card elevation={Elevation.TWO} className={styles.cardSpacing}>
                <div className={styles.flexHeader}>
                  <H5>2. Create Primary Keys</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() => copyToClipboard(subscriberSetupSql.createConstraintsSql)}
                    small
                  />
                </div>
                <pre className={styles.codeBlock}>{subscriberSetupSql.createConstraintsSql}</pre>
              </Card>

              {subscriberSetupSql.createIndexesSql && (
                <Card elevation={Elevation.TWO} style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <H5>3. Create Indexes</H5>
                    <Button
                      icon={IconNames.DUPLICATE}
                      text="Copy"
                      onClick={() => copyToClipboard(subscriberSetupSql.createIndexesSql)}
                      small
                    />
                  </div>
                  <pre
                    style={{
                      padding: "15px",
                      borderRadius: "3px",
                      overflow: "auto",
                      fontSize: "12px",
                      fontFamily: "monospace",
                    }}
                  >
                    {subscriberSetupSql.createIndexesSql}
                  </pre>
                </Card>
              )}

              <Card elevation={Elevation.TWO}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <H5>4. Create Subscription</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() => copyToClipboard(finalSubscriptionTemplate)}
                    small
                  />
                </div>
                <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN} style={{ marginBottom: "10px" }}>
                  <strong>Important:</strong> Replace the password placeholder with your actual replicator password:
                  <ul style={{ marginTop: "5px", marginBottom: "0" }}>
                    <li>
                      <code>YOUR_REPLICATOR_PASSWORD</code>
                    </li>
                  </ul>
                  <div style={{ marginTop: "10px", fontSize: "13px" }}>
                    The hostname and port have been automatically populated based on your current environment.
                  </div>
                </Callout>
                <pre
                  style={{
                    padding: "15px",
                    borderRadius: "3px",
                    overflow: "auto",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                >
                  {finalSubscriptionTemplate}
                </pre>
              </Card>
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

              <Card elevation={Elevation.TWO} style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <H5>Drop Subscription</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() =>
                      copyToClipboard(
                        "-- On subscriber: Drop the subscription\nDROP SUBSCRIPTION IF EXISTS historian_sub;",
                      )
                    }
                    small
                  />
                </div>
                <p style={{ marginBottom: "10px", fontSize: "13px" }}>
                  Run this command on the <strong>subscriber database</strong> to remove the subscription.
                </p>
                <pre
                  style={{
                    padding: "15px",
                    borderRadius: "3px",
                    overflow: "auto",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                >
                  {`-- On subscriber: Drop the subscription
DROP SUBSCRIPTION IF EXISTS historian_sub;`}
                </pre>
              </Card>

              <Card elevation={Elevation.TWO} style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <H5>Drop Replication Slot (Publisher)</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() =>
                      copyToClipboard(
                        "-- On publisher: Drop the replication slot\nSELECT pg_drop_replication_slot('historian_sub_slot');",
                      )
                    }
                    small
                  />
                </div>
                <p style={{ marginBottom: "10px", fontSize: "13px" }}>
                  <strong>Optional:</strong> Run this command on the <strong>publisher database</strong> to remove the
                  replication slot if it was not automatically cleaned up.
                </p>
                <pre
                  style={{
                    padding: "15px",
                    borderRadius: "3px",
                    overflow: "auto",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                >
                  {`-- On publisher: Drop the replication slot
SELECT pg_drop_replication_slot('historian_sub_slot');`}
                </pre>
              </Card>

              <Card elevation={Elevation.TWO}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <H5>Drop Replicated Tables</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() =>
                      copyToClipboard(
                        "-- On subscriber: Drop replicated tables\nDROP TABLE IF EXISTS data CASCADE;\nDROP TABLE IF EXISTS topics CASCADE;",
                      )
                    }
                    small
                  />
                </div>
                <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN} style={{ marginBottom: "10px" }}>
                  <strong>Caution:</strong> This will permanently delete all replicated data on the subscriber. Only run
                  this if you want to completely remove the replicated tables.
                </Callout>
                <p style={{ marginBottom: "10px", fontSize: "13px" }}>
                  <strong>Optional:</strong> Run these commands on the <strong>subscriber database</strong> to remove
                  the replicated tables.
                </p>
                <pre
                  style={{
                    padding: "15px",
                    borderRadius: "3px",
                    overflow: "auto",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                >
                  {`-- On subscriber: Drop replicated tables
DROP TABLE IF EXISTS data CASCADE;
DROP TABLE IF EXISTS topics CASCADE;`}
                </pre>
              </Card>
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

        {/* Monitoring Tab */}
        <Tab
          id="monitoring"
          title="Monitoring"
          panel={
            <div className={styles.tabPanel}>
              <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} style={{ marginBottom: "20px" }}>
                Use these queries to monitor replication health and troubleshoot issues.
              </Callout>

              <Card elevation={Elevation.TWO} style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <H5>Check Schema Match</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() => copyToClipboard(monitoringSql.checkSchemaMatchSql)}
                    small
                  />
                </div>
                <pre
                  style={{
                    padding: "15px",
                    borderRadius: "3px",
                    overflow: "auto",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                >
                  {monitoringSql.checkSchemaMatchSql}
                </pre>
              </Card>

              <Card elevation={Elevation.TWO} style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <H5>Check Replication Lag</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() => copyToClipboard(monitoringSql.checkReplicationLagSql)}
                    small
                  />
                </div>
                <pre
                  style={{
                    padding: "15px",
                    borderRadius: "3px",
                    overflow: "auto",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                >
                  {monitoringSql.checkReplicationLagSql}
                </pre>
              </Card>

              <Card elevation={Elevation.TWO} style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <H5>Check Subscription Status</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() => copyToClipboard(monitoringSql.checkSubscriptionStatusSql)}
                    small
                  />
                </div>
                <pre
                  style={{
                    padding: "15px",
                    borderRadius: "3px",
                    overflow: "auto",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                >
                  {monitoringSql.checkSubscriptionStatusSql}
                </pre>
              </Card>

              <Card elevation={Elevation.TWO}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <H5>Check Sync Errors</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() => copyToClipboard(monitoringSql.checkSyncErrorsSql)}
                    small
                  />
                </div>
                <pre
                  style={{
                    padding: "15px",
                    borderRadius: "3px",
                    overflow: "auto",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                >
                  {monitoringSql.checkSyncErrorsSql}
                </pre>
              </Card>
            </div>
          }
        />
      </Tabs>
    </div>
  );
}
