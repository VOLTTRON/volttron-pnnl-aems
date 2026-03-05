"use client";

import { HistorianReplicationInfoDocument, HistorianReplicationInfoQuery } from "@/graphql-codegen/graphql";
import { Button, Callout, Card, Elevation, H3, H4, H5, Intent, NonIdealState, Spinner, Tab, Tabs } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { useQuery } from "@apollo/client";
import { useContext, useState } from "react";
import { NotificationContext, NotificationType } from "../components/providers";

export default function HistorianPage() {
  const { createNotification } = useContext(NotificationContext);
  const { data, loading, error } = useQuery(HistorianReplicationInfoDocument, {
    fetchPolicy: "cache-and-network",
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });
  const [activeTab, setActiveTab] = useState("publisher");

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
    return (
      <NonIdealState
        icon={IconNames.ERROR}
        title="Error Loading Replication Info"
        description={error.message}
      />
    );
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

  const { publisherInfo, subscriberSetupSql, monitoringSql } = data.historianReplicationInfo;

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <H3>Historian Database Replication</H3>
      <p style={{ marginBottom: "20px", color: "#5C7080" }}>
        This page provides auto-generated SQL and information for setting up historian database replication to remote offsite locations.
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
            <div style={{ marginTop: "20px" }}>
              <Card elevation={Elevation.TWO} style={{ marginBottom: "20px" }}>
                <H4>Publication Status</H4>
                <table className="bp5-html-table bp5-html-table-striped" style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td><strong>Publication Name:</strong></td>
                      <td>{publisherInfo.publicationName}</td>
                    </tr>
                    <tr>
                      <td><strong>Active Connections:</strong></td>
                      <td>{publisherInfo.activeConnections}</td>
                    </tr>
                    <tr>
                      <td><strong>Published Tables:</strong></td>
                      <td>{publisherInfo.publishedTables?.join(", ") || "None"}</td>
                    </tr>
                  </tbody>
                </table>
              </Card>

              {publisherInfo.replicationSlots && publisherInfo.replicationSlots.length > 0 && (
                <Card elevation={Elevation.TWO}>
                  <H4>Replication Slots</H4>
                  <table className="bp5-html-table bp5-html-table-striped" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>Slot Name</th>
                        <th>Plugin</th>
                        <th>Type</th>
                        <th>Active</th>
                        <th>Restart LSN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {publisherInfo.replicationSlots.map((slot: any) => (
                        <tr key={slot.slotName}>
                          <td>{slot.slotName}</td>
                          <td>{slot.plugin}</td>
                          <td>{slot.slotType}</td>
                          <td>
                            <span className={slot.active ? "bp5-tag bp5-intent-success" : "bp5-tag bp5-intent-warning"}>
                              {slot.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{slot.restartLsn}</td>
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
            <div style={{ marginTop: "20px" }}>
              <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} style={{ marginBottom: "20px" }}>
                Run these SQL commands on your <strong>subscriber database</strong> to set up replication.
              </Callout>

              <Card elevation={Elevation.TWO} style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <H5>1. Create Tables</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() => copyToClipboard(subscriberSetupSql.createTablesSql)}
                    small
                  />
                </div>
                <pre style={{
                  backgroundColor: "#f5f8fa",
                  padding: "15px",
                  borderRadius: "3px",
                  overflow: "auto",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  maxHeight: "300px"
                }}>
                  {subscriberSetupSql.createTablesSql}
                </pre>
              </Card>

              <Card elevation={Elevation.TWO} style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <H5>2. Create Primary Keys</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() => copyToClipboard(subscriberSetupSql.createConstraintsSql)}
                    small
                  />
                </div>
                <pre style={{
                  backgroundColor: "#f5f8fa",
                  padding: "15px",
                  borderRadius: "3px",
                  overflow: "auto",
                  fontSize: "12px",
                  fontFamily: "monospace"
                }}>
                  {subscriberSetupSql.createConstraintsSql}
                </pre>
              </Card>

              {subscriberSetupSql.createIndexesSql && (
                <Card elevation={Elevation.TWO} style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <H5>3. Create Indexes</H5>
                    <Button
                      icon={IconNames.DUPLICATE}
                      text="Copy"
                      onClick={() => copyToClipboard(subscriberSetupSql.createIndexesSql)}
                      small
                    />
                  </div>
                  <pre style={{
                    backgroundColor: "#f5f8fa",
                    padding: "15px",
                    borderRadius: "3px",
                    overflow: "auto",
                    fontSize: "12px",
                    fontFamily: "monospace"
                  }}>
                    {subscriberSetupSql.createIndexesSql}
                  </pre>
                </Card>
              )}

              <Card elevation={Elevation.TWO}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <H5>4. Create Subscription</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() => copyToClipboard(subscriberSetupSql.createSubscriptionTemplate)}
                    small
                  />
                </div>
                <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN} style={{ marginBottom: "10px" }}>
                  <strong>Important:</strong> Replace the placeholder values with your actual connection details:
                  <ul style={{ marginTop: "5px", marginBottom: "0" }}>
                    <li><code>YOUR_PUBLISHER_HOSTNAME</code></li>
                    <li><code>YOUR_HISTORIAN_REPLICATION_PORT</code></li>
                    <li><code>YOUR_REPLICATOR_PASSWORD</code></li>
                  </ul>
                </Callout>
                <pre style={{
                  backgroundColor: "#f5f8fa",
                  padding: "15px",
                  borderRadius: "3px",
                  overflow: "auto",
                  fontSize: "12px",
                  fontFamily: "monospace"
                }}>
                  {subscriberSetupSql.createSubscriptionTemplate}
                </pre>
              </Card>
            </div>
          }
        />

        {/* Monitoring Tab */}
        <Tab
          id="monitoring"
          title="Monitoring"
          panel={
            <div style={{ marginTop: "20px" }}>
              <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} style={{ marginBottom: "20px" }}>
                Use these queries to monitor replication health and troubleshoot issues.
              </Callout>

              <Card elevation={Elevation.TWO} style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <H5>Check Schema Match</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() => copyToClipboard(monitoringSql.checkSchemaMatchSql)}
                    small
                  />
                </div>
                <pre style={{
                  backgroundColor: "#f5f8fa",
                  padding: "15px",
                  borderRadius: "3px",
                  overflow: "auto",
                  fontSize: "12px",
                  fontFamily: "monospace"
                }}>
                  {monitoringSql.checkSchemaMatchSql}
                </pre>
              </Card>

              <Card elevation={Elevation.TWO} style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <H5>Check Replication Lag</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() => copyToClipboard(monitoringSql.checkReplicationLagSql)}
                    small
                  />
                </div>
                <pre style={{
                  backgroundColor: "#f5f8fa",
                  padding: "15px",
                  borderRadius: "3px",
                  overflow: "auto",
                  fontSize: "12px",
                  fontFamily: "monospace"
                }}>
                  {monitoringSql.checkReplicationLagSql}
                </pre>
              </Card>

              <Card elevation={Elevation.TWO} style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <H5>Check Subscription Status</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() => copyToClipboard(monitoringSql.checkSubscriptionStatusSql)}
                    small
                  />
                </div>
                <pre style={{
                  backgroundColor: "#f5f8fa",
                  padding: "15px",
                  borderRadius: "3px",
                  overflow: "auto",
                  fontSize: "12px",
                  fontFamily: "monospace"
                }}>
                  {monitoringSql.checkSubscriptionStatusSql}
                </pre>
              </Card>

              <Card elevation={Elevation.TWO}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <H5>Check Sync Errors</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() => copyToClipboard(monitoringSql.checkSyncErrorsSql)}
                    small
                  />
                </div>
                <pre style={{
                  backgroundColor: "#f5f8fa",
                  padding: "15px",
                  borderRadius: "3px",
                  overflow: "auto",
                  fontSize: "12px",
                  fontFamily: "monospace"
                }}>
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
