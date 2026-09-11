"use client";

import {
  Button,
  Callout,
  Card,
  ControlGroup,
  Elevation,
  FormGroup,
  H3,
  H5,
  HTMLSelect,
  Intent,
  NonIdealState,
  Spinner,
  Tab,
  Tabs,
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { useQuery } from "@apollo/client";
import { useContext, useMemo, useState } from "react";
import {
  OrderBy,
  PreviewControlTemplatesDocument,
  ReadControlsDocument,
  ReadControlsQuery,
} from "@/graphql-codegen/graphql";
import { NotificationContext, NotificationType } from "../components/providers";
import styles from "./page.module.scss";

type ControlRow = NonNullable<ReadControlsQuery["readControls"]>[number];
type BuildingOption = {
  controlId: string;
  campus: string;
  building: string;
  label: string;
};

const TEMPLATE_ORDER = ["config", "control_config", "criteria_config", "pairwise_criteria"] as const;

export default function TemplatesPage() {
  const { createNotification } = useContext(NotificationContext);
  const [selectedControlId, setSelectedControlId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>(TEMPLATE_ORDER[0]);

  const controlsQuery = useQuery(ReadControlsDocument, {
    variables: { orderBy: [{ label: OrderBy.Asc }] },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const controls: ControlRow[] = useMemo(() => controlsQuery.data?.readControls ?? [], [controlsQuery.data]);

  const buildings: BuildingOption[] = useMemo(() => {
    const opts: BuildingOption[] = [];
    for (const control of controls) {
      if (typeof control.id !== "string") continue;
      const campus = control.campus ?? control.units?.[0]?.campus ?? "";
      const building = control.building ?? control.units?.[0]?.building ?? "";
      opts.push({
        controlId: control.id,
        campus,
        building,
        label: control.label ?? control.name ?? `${campus} / ${building}`,
      });
    }
    opts.sort((a, b) => {
      const cmp = a.campus.localeCompare(b.campus);
      if (cmp !== 0) return cmp;
      return a.building.localeCompare(b.building);
    });
    return opts;
  }, [controls]);

  const selectedBuilding = useMemo(
    () => buildings.find((b) => b.controlId === selectedControlId),
    [buildings, selectedControlId],
  );

  const preview = useQuery(PreviewControlTemplatesDocument, {
    variables: { where: { id: selectedControlId } },
    skip: !selectedControlId,
    fetchPolicy: "cache-and-network",
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const rendered = (preview.data?.previewControlTemplates ?? null) as Record<string, unknown> | null;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      createNotification?.("Copied to clipboard", NotificationType.Notification);
    } catch (err) {
      createNotification?.("Failed to copy text", NotificationType.Error);
      console.error("Failed to copy text:", err);
    }
  };

  const downloadAs = (text: string, filename: string, mime = "application/json") => {
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

  const filenameFor = (basename: string): string => {
    const parts = [basename, selectedBuilding?.campus, selectedBuilding?.building].filter(Boolean).join("-");
    return `${parts || basename}.json`;
  };

  const renderTab = (key: string) => {
    if (!rendered) return null;
    const value = rendered[key];
    const text = JSON.stringify(value ?? null, null, 2);
    return (
      <div className={styles.tabPanel}>
        <Card elevation={Elevation.TWO} className={styles.cardSpacing}>
          <div className={styles.flexHeader}>
            <H5>{key}.json</H5>
            <ControlGroup>
              <Button icon={IconNames.DUPLICATE} text="Copy" onClick={() => copyToClipboard(text)} small />
              <Button
                icon={IconNames.DOWNLOAD}
                text="Download .json"
                onClick={() => downloadAs(text, filenameFor(key))}
                small
              />
            </ControlGroup>
          </div>
          <pre className={styles.codeBlockWithMaxHeight}>{text}</pre>
        </Card>
      </div>
    );
  };

  return (
    <div className={styles.pageContainer}>
      <H3>ILC Configuration Templates</H3>
      <p className={styles.pageDescription}>
        Pick a building to see the rendered ILC configuration templates that would be pushed to the VOLTTRON ILC agent
        for that building&apos;s control. Templates are rendered against the control&apos;s current units and can be
        downloaded for verification. To edit the source templates, modify the files under{" "}
        <code>aems-edge/configurations/templates/</code> and run <code>./refresh-templates.sh</code> (or the{" "}
        <code>.ps1</code>) from <code>aems-app/</code>.
      </p>

      <Card elevation={Elevation.TWO} className={styles.cardSpacing}>
        <FormGroup label="Building" labelFor="template-building-select">
          {controlsQuery.loading && buildings.length === 0 ? (
            <Spinner size={20} />
          ) : (
            <HTMLSelect
              id="template-building-select"
              value={selectedControlId}
              onChange={(e) => setSelectedControlId(e.target.value)}
              fill
            >
              <option value="">— Select a building —</option>
              {buildings.map((b) => (
                <option key={b.controlId} value={b.controlId}>
                  {b.campus} / {b.building} ({b.label})
                </option>
              ))}
            </HTMLSelect>
          )}
        </FormGroup>
      </Card>

      {selectedControlId && preview.loading && !rendered && (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Spinner size={40} />
        </div>
      )}

      {selectedControlId && preview.error && !rendered && (
        <NonIdealState
          icon={IconNames.ERROR}
          title="Error rendering templates"
          description={preview.error.message}
        />
      )}

      {rendered && (
        <Tabs id="template-tabs" selectedTabId={activeTab} onChange={(id) => setActiveTab(id as string)} large>
          {TEMPLATE_ORDER.map((key) => (
            <Tab key={key} id={key} title={`${key}.json`} panel={renderTab(key) ?? <div />} />
          ))}
        </Tabs>
      )}

      {!selectedControlId && (
        <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN}>
          Select a building above to render its control&apos;s ILC templates.
        </Callout>
      )}
    </div>
  );
}
