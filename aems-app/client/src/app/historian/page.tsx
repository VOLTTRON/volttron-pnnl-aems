"use client";

import { HistorianReplicationInfoDocument, HistorianReplicationInfoQuery } from "@/graphql-codegen/graphql";
import { Button, Callout, Card, Elevation, H3, H4, H5, Intent, NonIdealState, Spinner, Tab, Tabs } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { useQuery } from "@apollo/client";
import { useContext, useState, useRef, useEffect } from "react";
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
  const [tabWidth, setTabWidth] = useState<number | undefined>(undefined);
  
  const publisherRef = useRef<HTMLDivElement>(null);
  const subscriberRef = useRef<HTMLDivElement>(null);
  const monitoringRef = useRef<HTMLDivElement>(null);
  const removalRef = useRef<HTMLDivElement>(null);
  const unitsRef = useRef<HTMLDivElement>(null);

  // Measure and set the maximum width from all tabs
  useEffect(() => {
    if (!data) return;
    
    const measureWidth = () => {
      const widths = [
        publisherRef.current?.scrollWidth || 0,
        subscriberRef.current?.scrollWidth || 0,
        monitoringRef.current?.scrollWidth || 0,
        removalRef.current?.scrollWidth || 0,
        unitsRef.current?.scrollWidth || 0,
      ];
      const maxWidth = Math.max(...widths);
      if (maxWidth > 0) {
        setTabWidth(maxWidth);
      }
    };

    // Measure after a short delay to ensure content is rendered
    const timeoutId = setTimeout(measureWidth, 100);
    return () => clearTimeout(timeoutId);
  }, [data]);

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

  const { publisherInfo, subscriberSetupSql, monitoringSql, unitPublishingStatus } = data.historianReplicationInfo;

  // Replace hostname placeholder with current browser hostname
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'YOUR_HOSTNAME';
  const finalSubscriptionTemplate = subscriberSetupSql.createSubscriptionTemplate.replace('{{HOSTNAME}}', hostname);

  return (
    <div style={{ padding: "20px", maxWidth: "1400px" }}>
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
            <div ref={publisherRef} style={{ marginTop: "20px", width: tabWidth }}>
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
            <div ref={subscriberRef} style={{ marginTop: "20px", width: tabWidth }}>
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
                    onClick={() => copyToClipboard(finalSubscriptionTemplate)}
                    small
                  />
                </div>
                <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN} style={{ marginBottom: "10px" }}>
                  <strong>Important:</strong> Replace the password placeholder with your actual replicator password:
                  <ul style={{ marginTop: "5px", marginBottom: "0" }}>
                    <li><code>YOUR_REPLICATOR_PASSWORD</code></li>
                  </ul>
                  <div style={{ marginTop: "10px", fontSize: "13px" }}>
                    The hostname and port have been automatically populated based on your current environment.
                  </div>
                </Callout>
                <pre style={{
                  padding: "15px",
                  borderRadius: "3px",
                  overflow: "auto",
                  fontSize: "12px",
                  fontFamily: "monospace"
                }}>
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
            <div ref={removalRef} style={{ marginTop: "20px", width: tabWidth }}>
              <Callout intent={Intent.DANGER} icon={IconNames.WARNING_SIGN} style={{ marginBottom: "20px" }}>
                <strong>Warning:</strong> These commands will remove the subscription and optionally delete replicated data. 
                Use with caution as these operations are <strong>destructive</strong> and cannot be undone.
              </Callout>

              <Card elevation={Elevation.TWO} style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <H5>Drop Subscription</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() => copyToClipboard("-- On subscriber: Drop the subscription\nDROP SUBSCRIPTION IF EXISTS historian_sub;")}
                    small
                  />
                </div>
                <p style={{ marginBottom: "10px", fontSize: "13px" }}>
                  Run this command on the <strong>subscriber database</strong> to remove the subscription.
                </p>
                <pre style={{
                  padding: "15px",
                  borderRadius: "3px",
                  overflow: "auto",
                  fontSize: "12px",
                  fontFamily: "monospace"
                }}>
                  {`-- On subscriber: Drop the subscription
DROP SUBSCRIPTION IF EXISTS historian_sub;`}
                </pre>
              </Card>

              <Card elevation={Elevation.TWO} style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <H5>Drop Replication Slot (Publisher)</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() => copyToClipboard("-- On publisher: Drop the replication slot\nSELECT pg_drop_replication_slot('historian_sub_slot');")}
                    small
                  />
                </div>
                <p style={{ marginBottom: "10px", fontSize: "13px" }}>
                  <strong>Optional:</strong> Run this command on the <strong>publisher database</strong> to remove the replication slot 
                  if it was not automatically cleaned up.
                </p>
                <pre style={{
                  padding: "15px",
                  borderRadius: "3px",
                  overflow: "auto",
                  fontSize: "12px",
                  fontFamily: "monospace"
                }}>
                  {`-- On publisher: Drop the replication slot
SELECT pg_drop_replication_slot('historian_sub_slot');`}
                </pre>
              </Card>

              <Card elevation={Elevation.TWO}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <H5>Drop Replicated Tables</H5>
                  <Button
                    icon={IconNames.DUPLICATE}
                    text="Copy"
                    onClick={() => copyToClipboard("-- On subscriber: Drop replicated tables\nDROP TABLE IF EXISTS data CASCADE;\nDROP TABLE IF EXISTS topics CASCADE;")}
                    small
                  />
                </div>
                <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN} style={{ marginBottom: "10px" }}>
                  <strong>Caution:</strong> This will permanently delete all replicated data on the subscriber. 
                  Only run this if you want to completely remove the replicated tables.
                </Callout>
                <p style={{ marginBottom: "10px", fontSize: "13px" }}>
                  <strong>Optional:</strong> Run these commands on the <strong>subscriber database</strong> to remove the replicated tables.
                </p>
                <pre style={{
                  padding: "15px",
                  borderRadius: "3px",
                  overflow: "auto",
                  fontSize: "12px",
                  fontFamily: "monospace"
                }}>
                  {`-- On subscriber: Drop replicated tables
DROP TABLE IF EXISTS data CASCADE;
DROP TABLE IF EXISTS topics CASCADE;`}
                </pre>
              </Card>
            </div>
          }
        />

        {/* Unit Status Tab */}
        <Tab
          id="units"
          title="Unit Status"
          panel={
            <div ref={unitsRef} style={{ marginTop: "20px", width: tabWidth }}>
              <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} style={{ marginBottom: "20px" }}>
                Monitor which units are actively publishing data to the historian database. Status updates every time this page is loaded.
              </Callout>

              {unitPublishingStatus && unitPublishingStatus.length > 0 ? (
                <Card elevation={Elevation.TWO}>
                  <H4>Unit Publishing Status</H4>
                  <table className="bp5-html-table bp5-html-table-striped" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>Campus</th>
                        <th>Building</th>
                        <th>Topic</th>
                        <th>Last Published</th>
                        <th>Time Ago</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unitPublishingStatus.map((unit: any, index: number) => {
                        const statusIntent = 
                          unit.status === 'active' ? Intent.SUCCESS :
                          unit.status === 'stale' ? Intent.WARNING :
                          Intent.DANGER;
                        
                        const statusText = 
                          unit.status === 'active' ? 'Active' :
                          unit.status === 'stale' ? 'Stale' :
                          'Inactive';

                        return (
                          <tr key={index}>
                            <td>{unit.campus || '-'}</td>
                            <td>{unit.building || '-'}</td>
                            <td><strong>{unit.topic}</strong></td>
                            <td>{new Date(unit.lastPublished).toLocaleString()}</td>
                            <td>{unit.minutesAgo} minute{unit.minutesAgo !== 1 ? 's' : ''} ago</td>
                            <td>
                              <span className={`bp5-tag bp5-intent-${statusIntent === Intent.SUCCESS ? 'success' : statusIntent === Intent.WARNING ? 'warning' : 'danger'}`}>
                                {statusText}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ marginTop: "15px", fontSize: "13px", color: "#5C7080" }}>
                    <strong>Status Legend:</strong>
                    <ul style={{ marginTop: "5px", marginBottom: "0" }}>
                      <li><strong>Active:</strong> Data received within the last 5 minutes</li>
                      <li><strong>Stale:</strong> Data received 5-60 minutes ago</li>
                      <li><strong>Inactive:</strong> No data received in over 60 minutes</li>
                    </ul>
                  </div>
                </Card>
              ) : (
                <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN}>
                  No unit publishing data available. Units will appear here once they start publishing data to the historian database.
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
            <div ref={monitoringRef} style={{ marginTop: "20px", width: tabWidth }}>
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
