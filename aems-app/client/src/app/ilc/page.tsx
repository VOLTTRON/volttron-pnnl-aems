"use client";

import styles from "./page.module.scss";
import {
  Alert,
  Button,
  Card,
  Collapse,
  InputGroup,
  Intent,
  Label,
  Menu,
  MenuItem,
  Position,
  Tree,
  HTMLSelect,
} from "@blueprintjs/core";
import { IconName, IconNames } from "@blueprintjs/icons";
import { useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  ReadControlsQuery,
  ReadControlsDocument,
  UpdateControlDocument,
  UpdateUnitDocument,
  OrderBy,
} from "@/graphql-codegen/graphql";
import { NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { Term } from "@/utils/client";
import { UnitEditor } from "./components/UnitEditor";

// Stage type mappings for status display
const StageType = {
  UpdateType: { label: "update" },
  DeleteType: { label: "delete" },
  ProcessType: { label: "process" },
  CreateType: { label: "create" },
  CompleteType: { label: "complete" },
  FailType: { label: "fail" },
};

interface ILCState {
  editing: Partial<Term<NonNullable<ReadControlsQuery["readControls"]>[0]>> | null;
  expanded: string | null;
  confirm: (() => void) | null;
}

export default function ILCPage() {
  const [state, setState] = useState<ILCState>({
    editing: null,
    expanded: null,
    confirm: null,
  });

  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);

  // Fetch controls with full unit details
  const { data, loading, refetch } = useQuery(ReadControlsDocument, {
    variables: {
      orderBy: { createdAt: OrderBy.Desc },
    },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
    pollInterval: 5000, // Poll every 5 seconds for real-time updates
  });

  const [updateControl] = useMutation(UpdateControlDocument, {
    refetchQueries: [{ query: ReadControlsDocument }],
    onCompleted() {
      createNotification?.("Control updated successfully", NotificationType.Notification);
    },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const [updateUnit] = useMutation(UpdateUnitDocument, {
    refetchQueries: [{ query: ReadControlsDocument }],
    onCompleted() {
      createNotification?.("Unit updated successfully", NotificationType.Notification);
    },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const controls = useMemo(() => data?.readControls ?? [], [data?.readControls]);

  const getValue = (field: string, control?: any) => {
    const temp = control ?? controls?.find((v) => v.id === state.editing?.id);
    return (state.editing as any)?.[field] ?? temp?.[field];
  };

  const handleChange = (field: string) => {
    return (value: any) => {
      if (state.editing) {
        setState(prev => ({
          ...prev,
          editing: {
            ...prev.editing,
            [field]: value,
          } as any,
        }));
      }
    };
  };

  const handleEdit = (control: Term<NonNullable<ReadControlsQuery["readControls"]>[0]>) => {
    const current = state.editing && controls?.find((v) => v.id === state.editing.id);
    if (current && isSave(current)) {
      setState(prev => ({
        ...prev,
        confirm: () =>
          setState(prev => ({
            ...prev,
            editing: { 
              id: control.id, 
              label: control.label,
              correlation: control.correlation,
              units: control.units?.map((v) => ({ id: v.id })) || []
            },
          })),
      }));
    } else {
      setState(prev => ({
        ...prev,
        editing: { 
          id: control.id, 
          label: control.label,
          correlation: control.correlation,
          units: control.units?.map((v) => ({ id: v.id })) || []
        },
      }));
    }
  };

  const handleCancel = () => {
    const current = state.editing && controls?.find((v) => v.id === state.editing.id);
    if (current && isSave(current)) {
      setState(prev => ({
        ...prev,
        confirm: () => setState(prev => ({ ...prev, editing: null })),
      }));
    } else {
      setState(prev => ({ ...prev, editing: null }));
    }
  };

  const handleConfirm = () => {
    const { confirm } = state;
    setState(prev => ({ ...prev, confirm: null }));
    confirm?.();
  };

  const handleSave = () => {
    if (state.editing?.id) {
      updateControl({
        variables: {
          where: { id: state.editing.id },
          update: {
            label: state.editing.label as string,
            correlation: state.editing.correlation as string,
          },
        },
      });
    }
  };

  const handlePush = (control: any) => {
    if (control.id) {
      updateControl({
        variables: {
          where: { id: control.id },
          update: {
            stage: StageType.UpdateType.label as any,
          },
        },
      });
    }
  };

  const isSave = (control: any) => {
    if (!state.editing) return false;
    const original = controls.find(c => c.id === control.id);
    return (
      state.editing.label !== original?.label ||
      state.editing.correlation !== original?.correlation
    );
  };

  const isPush = (control: any) => {
    switch (control.stage) {
      case StageType.UpdateType.label:
      case StageType.DeleteType.label:
      case StageType.ProcessType.label:
        return false;
      case StageType.CreateType.label:
      case StageType.CompleteType.label:
      case StageType.FailType.label:
      default:
        return !isSave(control);
    }
  };

  const renderStatus = (item: any) => {
    let icon: IconName = IconNames.ISSUE;
    let intent: Intent = Intent.WARNING;
    let message: string = "Push ILC Configuration";
    
    switch (item.stage) {
      case StageType.UpdateType.label:
        icon = IconNames.REFRESH;
        intent = Intent.PRIMARY;
        break;
      case StageType.ProcessType.label:
        icon = IconNames.REFRESH;
        intent = Intent.SUCCESS;
        break;
      case StageType.CreateType.label:
        icon = IconNames.ISSUE;
        intent = Intent.WARNING;
        break;
      case StageType.DeleteType.label:
        icon = IconNames.DELETE;
        intent = Intent.DANGER;
        break;
      case StageType.CompleteType.label:
        icon = IconNames.CONFIRM;
        intent = Intent.SUCCESS;
        break;
      case StageType.FailType.label:
        icon = IconNames.ERROR;
        intent = Intent.DANGER;
        break;
      default:
    }

    const notParticipating = item.peakLoadExclude;
    if (notParticipating) {
      icon = IconNames.DISABLE;
      intent = Intent.NONE;
    }

    if (item.units) {
      return (
        <Button
          icon={icon}
          intent={intent}
          minimal
          onClick={() => handlePush(item)}
          disabled={!isPush(item)}
          title={message}
        />
      );
    } else {
      return <Button icon={icon} intent={intent} minimal />;
    }
  };

  const renderConfirm = () => {
    if (state.confirm === null) {
      return null;
    }
    return (
      <Alert
        intent={Intent.DANGER}
        isOpen={true}
        confirmButtonText="Yes"
        cancelButtonText="Cancel"
        onConfirm={handleConfirm}
        onClose={() => setState(prev => ({ ...prev, confirm: null }))}
      >
        <p>There are changes which have not been saved. Do you still want to continue?</p>
      </Alert>
    );
  };

  if (loading) {
    return <div className={styles.loading}>Loading Intelligent Load Control...</div>;
  }

  return (
    <div className={styles.controls}>
      <h1>Intelligent Load Control</h1>
      <div className={styles.list}>
        {controls?.map((control, i) => {
          const isEditing = control.id === state.editing?.id;
          
          return isEditing ? (
            <Card key={`control-${control.id ?? i}-editing`} interactive className={styles.editingCard}>
              <div className={styles.row}>
                <div>
                  <Label>
                    <h3>{control.label}</h3>
                  </Label>
                </div>
                <div className={styles.actions}>
                  {renderStatus(control)}
                  <Button
                    icon={IconNames.FLOPPY_DISK}
                    intent={Intent.PRIMARY}
                    minimal
                    onClick={handleSave}
                    disabled={!isSave(control)}
                    title="Save"
                  />
                  <Button
                    icon={IconNames.CROSS}
                    intent={Intent.PRIMARY}
                    minimal
                    onClick={handleCancel}
                    title="Exit"
                  />
                </div>
              </div>
              
              <div className={styles.row}>
                <div>
                  <Label>
                    <b>Campus</b>
                    <InputGroup type="text" value={(control as any).campus || ""} readOnly />
                  </Label>
                </div>
                <div>
                  <Label>
                    <b>Building</b>
                    <InputGroup type="text" value={(control as any).building || ""} readOnly />
                  </Label>
                </div>
                <div />
              </div>

              <div className={styles.row}>
                <div className={styles.label}>
                  <Label>
                    <b>ILC Label</b>
                    <InputGroup
                      type="text"
                      value={getValue("label", control)}
                      onChange={(e) => handleChange("label")(e.target.value)}
                    />
                  </Label>
                </div>
                <div />
              </div>

              <div className={styles.row}>
                <div className={styles.select}>
                  <Label>
                    <b>Participate in Grid Services</b>
                    <HTMLSelect
                      value={getValue("peakLoadExclude", control) ? "true" : "false"}
                      onChange={(e) => handleChange("peakLoadExclude")(e.target.value === "true")}
                      fill
                    >
                      <option value="false">Yes</option>
                      <option value="true">No</option>
                    </HTMLSelect>
                  </Label>
                </div>
                <div />
                <div />
              </div>

              <Label>
                <h3>Units</h3>
              </Label>
              
              {control.units?.map((unit, unitIndex) => (
                <div key={`unit-${unit.id ?? unitIndex}`}>
                  <Tree
                    contents={[
                      {
                        id: `unit-${unit.id}`,
                        label: (unit as any).label || `Unit ${unit.id}`,
                        hasCaret: true,
                        isExpanded: state.expanded === `${control.id}-${unit.id}`,
                      },
                    ]}
                    onNodeExpand={() => setState(prev => ({ ...prev, expanded: `${control.id}-${unit.id}` }))}
                    onNodeCollapse={() => setState(prev => ({ ...prev, expanded: null }))}
                    onNodeClick={() =>
                      setState(prev => ({
                        ...prev,
                        expanded: `${control.id}-${unit.id}` === prev.expanded ? null : `${control.id}-${unit.id}`,
                      }))
                    }
                  />
                  <Collapse isOpen={state.expanded === `${control.id}-${unit.id}`}>
                    <UnitEditor
                      unit={unit}
                      editing={state.editing?.units?.find((v: any) => v?.id === unit.id) ?? null}
                      handleChange={(field: string) => (value: any) => {
                        // Handle unit field changes
                        console.log(`Unit ${unit.id} field ${field} changed to:`, value);
                      }}
                      hidden={[
                        ...(getValue("peakLoadExclude", control) ? ["peakLoadExclude"] : []),
                        ...(getValue("peakLoadExclude", control) ? [
                          "zoneLocation",
                          "zoneMass", 
                          "zoneOrientation",
                          "zoneBuilding",
                          "coolingCapacity",
                          "compressors",
                          "heatPump",
                          "heatPumpBackup",
                          "coolingPeakOffset",
                          "heatingPeakOffset",
                        ] : []),
                        "optimalStartLockout",
                        "optimalStartDeviation",
                        "earliestStart",
                        "latestStart",
                        "economizer",
                        "economizerSetpoint",
                        "heatPumpLockout",
                        "coolingLockout",
                      ]}
                    />
                  </Collapse>
                </div>
              ))}
            </Card>
          ) : (
            <Card key={`control-${control.id ?? i}`} interactive className={styles.card}>
              <div className={styles.row}>
                <div>
                  <Label>
                    <h3>{control.label}</h3>
                  </Label>
                </div>
                <div className={styles.actions}>
                  {renderStatus(control)}
                  <Button
                    icon={IconNames.EDIT}
                    intent={Intent.PRIMARY}
                    minimal
                    onClick={() => handleEdit(control)}
                    title="Edit"
                  />
                </div>
              </div>
            </Card>
          );
        })}
        {renderConfirm()}
      </div>
    </div>
  );
}
