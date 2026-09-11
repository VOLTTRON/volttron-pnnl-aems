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
  ReadUnitsDocument,
  ReadUnitsQuery,
} from "@/graphql-codegen/graphql";
import { NotificationContext, NotificationType } from "../components/providers";
import styles from "./page.module.scss";

type UnitRow = NonNullable<ReadUnitsQuery["readUnits"]>[number];

const TEMPLATE_ORDER = ["config", "control_config", "criteria_config", "pairwise_criteria"] as const;

export default function TemplatesPage() {
  const { createNotification } = useContext(NotificationContext);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>(TEMPLATE_ORDER[0]);

  const unitsQuery = useQuery(ReadUnitsDocument, {
    variables: { orderBy: [{ campus: OrderBy.Asc }, { building: OrderBy.Asc }, { system: OrderBy.Asc }] },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const units: UnitRow[] = useMemo(() => unitsQuery.data?.readUnits ?? [], [unitsQuery.data]);
  const selectedUnit = useMemo(() => units.find((u) => u.id === selectedUnitId), [units, selectedUnitId]);
  const controlId = selectedUnit?.controlId ?? undefined;

  const preview = useQuery(PreviewControlTemplatesDocument, {
    variables: { where: { id: controlId ?? "" } },
    skip: !controlId,
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
    const parts = [basename, selectedUnit?.campus, selectedUnit?.building].filter(Boolean).join("-");
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
        Pick a unit to see the rendered ILC configuration templates that would be pushed to the VOLTTRON ILC agent for
        the unit&apos;s control. Templates are rendered against the control&apos;s current units and can be downloaded
        for verification.
      </p>

      <Card elevation={Elevation.TWO} className={styles.cardSpacing}>
        <FormGroup label="Unit" labelFor="template-unit-select">
          {unitsQuery.loading && units.length === 0 ? (
            <Spinner size={20} />
          ) : (
            <HTMLSelect
              id="template-unit-select"
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              fill
            >
              <option value="">— Select a unit —</option>
              {units
                .filter((u): u is UnitRow & { id: string } => typeof u.id === "string")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.campus} / {u.building} / {u.system} ({u.label})
                  </option>
                ))}
            </HTMLSelect>
          )}
        </FormGroup>
        {selectedUnit && !controlId && (
          <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN}>
            The selected unit is not attached to a control, so it has no templates to render.
          </Callout>
        )}
      </Card>

      {controlId && preview.loading && !rendered && (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Spinner size={40} />
        </div>
      )}

      {controlId && preview.error && !rendered && (
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

      {!selectedUnitId && (
        <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN}>
          Select a unit above to render its control&apos;s ILC templates.
        </Callout>
      )}
    </div>
  );
}
