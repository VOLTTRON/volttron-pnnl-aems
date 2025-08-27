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
  Tooltip,
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
import { CurrentContext, NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { Term } from "@/utils/client";
import { UnitEditor } from "./components/UnitEditor";
import { Role } from "@local/common";

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
  const { current } = useContext(CurrentContext);

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

    // Handle special cases for fields that should aggregate from units
    if (field === "campus" || field === "building") {
      // Get from first unit if available
      const firstUnit = temp?.units?.[0];
      return firstUnit?.[field] || "";
    }

    if (field === "peakLoadExclude") {
      // Aggregate from units - if any unit excludes peak load, show as excluded
      const units = temp?.units || [];
      if (units.length === 0) return false;
      return units.some((unit: any) => unit.peakLoadExclude);
    }

    return (state.editing as any)?.[field] ?? temp?.[field];
  };

  const handleChange = (field: string) => {
    return (value: any) => {
      if (state.editing) {
        // Special handling for peakLoadExclude - update all units
        if (field === "peakLoadExclude") {
          const control = controls?.find((v) => v.id === state.editing?.id);
          if (control?.units) {
            const updatedUnits = control.units.map((unit: any) => ({
              id: unit.id,
              peakLoadExclude: value,
            }));

            setState((prev) => ({
              ...prev,
              editing: {
                ...prev.editing,
                units: updatedUnits,
              } as any,
            }));
          }
        } else {
          setState((prev) => ({
            ...prev,
            editing: {
              ...prev.editing,
              [field]: value,
            } as any,
          }));
        }
      }
    };
  };

  const handleEdit = (control: Term<NonNullable<ReadControlsQuery["readControls"]>[0]>) => {
    const current = state.editing && controls?.find((v) => v.id === state.editing?.id);
    if (current && isSave(current)) {
      setState((prev) => ({
        ...prev,
        confirm: () =>
          setState((prev) => ({
            ...prev,
            editing: {
              id: control.id,
              label: control.label,
              correlation: control.correlation,
              units: control.units?.map((v) => ({ id: v.id })) || [],
            },
          })),
      }));
    } else {
      setState((prev) => ({
        ...prev,
        editing: {
          id: control.id,
          label: control.label,
          correlation: control.correlation,
          units: control.units?.map((v) => ({ id: v.id })) || [],
        },
      }));
    }
  };

  const handleCancel = () => {
    const current = state.editing && controls?.find((v) => v.id === state.editing?.id);
    if (current && isSave(current)) {
      setState((prev) => ({
        ...prev,
        confirm: () => setState((prev) => ({ ...prev, editing: null })),
      }));
    } else {
      setState((prev) => ({ ...prev, editing: null }));
    }
  };

  const handleConfirm = () => {
    const { confirm } = state;
    setState((prev) => ({ ...prev, confirm: null }));
    confirm?.();
  };

  const handleSave = () => {
    if (state.editing?.id) {
      // Update control fields
      updateControl({
        variables: {
          where: { id: state.editing.id },
          update: {
            label: state.editing.label as string,
            correlation: state.editing.correlation as string,
          },
        },
      });

      // Update unit fields if they exist
      if (state.editing.units && state.editing.units.length > 0) {
        state.editing.units.forEach((editedUnit: any) => {
          if (editedUnit.id) {
            const updateData: any = {};

            // Include all fields that have been changed
            Object.keys(editedUnit).forEach((key) => {
              if (key !== "id") {
                // Handle nested location object separately
                if (key === "location" && editedUnit.location) {
                  // For now, we'll update the unit's locationId if the location has an id
                  // In a full implementation, you might want to create/update the Location entity first
                  if (editedUnit.location.id) {
                    updateData.locationId = editedUnit.location.id;
                  }
                  // Don't include the location object itself in the update
                } else {
                  // Include all other fields including zoneLocation and heatPumpBackup
                  updateData[key] = editedUnit[key];
                }
              }
            });

            if (Object.keys(updateData).length > 0) {
              console.log("Updating unit with data:", { unitId: editedUnit.id, updateData });
              updateUnit({
                variables: {
                  where: { id: editedUnit.id },
                  update: updateData,
                },
              });
            }
          }
        });
      }
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
    const original = controls.find((c) => c.id === control.id);

    // Check control-level changes
    const controlChanged =
      state.editing.label !== original?.label || state.editing.correlation !== original?.correlation;

    // Check unit-level changes
    let unitsChanged = false;
    if (state.editing.units && state.editing.units.length > 0) {
      unitsChanged = state.editing.units.some((editedUnit: any) => {
        if (!editedUnit.id) return false;

        const originalUnit = original?.units?.find((u: any) => u.id === editedUnit.id);
        if (!originalUnit) return false;

        // Check if any field in the edited unit differs from the original
        return Object.keys(editedUnit).some((key) => {
          if (key === "id") return false;

          // Handle nested objects (like location)
          if (typeof editedUnit[key] === "object" && editedUnit[key] !== null) {
            const originalValue = (originalUnit as any)[key];
            if (typeof originalValue !== "object" || originalValue === null) return true;

            return Object.keys(editedUnit[key]).some(
              (nestedKey) => editedUnit[key][nestedKey] !== originalValue[nestedKey],
            );
          }

          return editedUnit[key] !== (originalUnit as any)[key];
        });
      });
    }

    return controlChanged || unitsChanged;
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
        message = "Updating Configuration";
        break;
      case StageType.ProcessType.label:
        icon = IconNames.REFRESH;
        intent = Intent.SUCCESS;
        message = "Processing Configuration";
        break;
      case StageType.CreateType.label:
        icon = IconNames.ISSUE;
        intent = Intent.WARNING;
        message = "Push ILC Configuration";
        break;
      case StageType.DeleteType.label:
        icon = IconNames.DELETE;
        intent = Intent.DANGER;
        message = "Deleting Configuration";
        break;
      case StageType.CompleteType.label:
        icon = IconNames.CONFIRM;
        intent = Intent.SUCCESS;
        message = "Configuration Complete";
        break;
      case StageType.FailType.label:
        icon = IconNames.ERROR;
        intent = Intent.DANGER;
        message = "Configuration Failed";
        break;
      default:
        message = "Push ILC Configuration";
    }

    const notParticipating = item.peakLoadExclude;
    if (notParticipating) {
      icon = IconNames.DISABLE;
      intent = Intent.NONE;
      message = "Not Participating in Grid Services";
    }

    if (item.units) {
      return (
        <Tooltip content={message} position={Position.TOP} disabled={!isPush(item)}>
          <Button icon={icon} intent={intent} minimal onClick={() => handlePush(item)} disabled={!isPush(item)} />
        </Tooltip>
      );
    } else {
      return (
        <Tooltip content={message} position={Position.TOP}>
          <Button icon={icon} intent={intent} minimal />
        </Tooltip>
      );
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
        onClose={() => setState((prev) => ({ ...prev, confirm: null }))}
      >
        <p>There are changes which have not been saved. Do you still want to continue?</p>
      </Alert>
    );
  };

  if (loading) {
    return <div className={styles.loading}>Loading Intelligent Load Control...</div>;
  }

  if (!Role.User.granted(...(current?.role?.split(" ") ?? []))) {
    return <div>You do not have permission to view this page.</div>;
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
                  <Tooltip content="Save" position={Position.TOP} disabled={!isSave(control)}>
                    <Button
                      icon={IconNames.FLOPPY_DISK}
                      intent={Intent.PRIMARY}
                      minimal
                      onClick={handleSave}
                      disabled={!isSave(control)}
                    />
                  </Tooltip>
                  <Tooltip content="Cancel" position={Position.TOP}>
                    <Button icon={IconNames.CROSS} intent={Intent.PRIMARY} minimal onClick={handleCancel} />
                  </Tooltip>
                </div>
              </div>

              <div className={styles.row}>
                <div>
                  <Label>
                    <b>Campus</b>
                    <InputGroup type="text" value={getValue("campus", control)} readOnly />
                  </Label>
                </div>
                <div>
                  <Label>
                    <b>Building</b>
                    <InputGroup type="text" value={getValue("building", control)} readOnly />
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
                    onNodeExpand={() => setState((prev) => ({ ...prev, expanded: `${control.id}-${unit.id}` }))}
                    onNodeCollapse={() => setState((prev) => ({ ...prev, expanded: null }))}
                    onNodeClick={() =>
                      setState((prev) => ({
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
                        setState((prev) => {
                          if (!prev.editing) return prev;

                          const updatedUnits = [...(prev.editing.units || [])];
                          const unitIndex = updatedUnits.findIndex((u: any) => u?.id === unit.id);

                          if (unitIndex >= 0) {
                            // Update existing unit
                            const updatedUnit = { ...updatedUnits[unitIndex] } as any;

                            // Handle nested field paths (e.g., "location.name")
                            if (field.includes(".")) {
                              const [parentField, childField] = field.split(".");
                              updatedUnit[parentField] = {
                                ...updatedUnit[parentField],
                                [childField]: value,
                              };
                            } else {
                              updatedUnit[field] = value;
                            }

                            updatedUnits[unitIndex] = updatedUnit;
                          } else {
                            // Add new unit with the field
                            const newUnit: any = { id: unit.id };

                            // Handle nested field paths
                            if (field.includes(".")) {
                              const [parentField, childField] = field.split(".");
                              newUnit[parentField] = { [childField]: value };
                            } else {
                              newUnit[field] = value;
                            }

                            updatedUnits.push(newUnit);
                          }

                          return {
                            ...prev,
                            editing: {
                              ...prev.editing,
                              units: updatedUnits,
                            },
                          };
                        });
                      }}
                      hidden={(() => {
                        // Get the unit's peakLoadExclude value (from editing state or original unit)
                        const editingUnit = state.editing?.units?.find((v: any) => v?.id === unit.id);
                        const unitPeakLoadExclude = editingUnit?.peakLoadExclude ?? (unit as any).peakLoadExclude;

                        return [
                          // Hide peakLoadExclude field in unit editor since it's controlled at control level
                          "peakLoadExclude",
                          // Hide grid services related fields if unit excludes peak load
                          ...(unitPeakLoadExclude
                            ? [
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
                              ]
                            : []),
                          // Always hide these advanced fields for now
                          "optimalStartLockout",
                          "optimalStartDeviation",
                          "earliestStart",
                          "latestStart",
                          "economizer",
                          "economizerSetpoint",
                          "heatPumpLockout",
                          "coolingLockout",
                        ];
                      })()}
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
                  <Tooltip content="Edit" position={Position.TOP}>
                    <Button icon={IconNames.EDIT} intent={Intent.PRIMARY} minimal onClick={() => handleEdit(control)} />
                  </Tooltip>
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
