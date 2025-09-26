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
  Position,
  Tree,
  HTMLSelect,
  Tooltip,
} from "@blueprintjs/core";
import { IconName, IconNames } from "@blueprintjs/icons";
import { useContext, useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useSubscription, useQuery } from "@apollo/client";
import {
  ReadControlsQuery,
  UpdateControlDocument,
  UpdateUnitDocument,
  OrderBy,
  SubscribeControlsDocument,
  ReadControlsDocument,
} from "@/graphql-codegen/graphql";
import { CurrentContext, NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { Term } from "@/utils/client";
import { Unit } from "./components/Unit";
import { Role, Stage, StageType } from "@local/common";
import { useOperationManager } from "../components/hooks/useOperationManager";
import { useMutationWithTracking } from "../components/hooks/useMutationWithTracking";

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
  const { hasAnyOperations, waitForAllOperations } = useOperationManager();
  const operationsInitiatedRef = useRef(false);
  const previousOperationsRef = useRef(false);

  // Subscribe to controls with full unit details for real-time updates
  const { data: subscribed } = useSubscription(SubscribeControlsDocument, {
    variables: {
      orderBy: { createdAt: OrderBy.Desc },
    },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const {
    data: queried,
    loading,
    startPolling,
  } = useQuery(ReadControlsDocument, {
    variables: {
      orderBy: { createdAt: OrderBy.Desc },
    },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const data = subscribed ?? queried;

  const [updateControl] = useMutationWithTracking(UpdateControlDocument, {
    operationType: "control",
    getEntityId: (variables) => variables?.where?.id,
    getDescription: (variables) => `Update control ${variables?.where?.id}`,
    onError: (error: any) => createNotification?.(error.message, NotificationType.Error),
  });

  const [updateUnit] = useMutationWithTracking(UpdateUnitDocument, {
    operationType: "unit",
    getEntityId: (variables) => variables?.where?.id,
    getDescription: (variables) => `Update unit ${variables?.where?.id}`,
    onError: (error: any) => createNotification?.(error.message, NotificationType.Error),
  });

  // Monitor operation completion and show notification
  useEffect(() => {
    const currentHasOperations = hasAnyOperations();

    // Track when operations start
    if (currentHasOperations && !previousOperationsRef.current) {
      operationsInitiatedRef.current = true;
    }

    // Show success notification when operations complete
    if (!currentHasOperations && previousOperationsRef.current && operationsInitiatedRef.current) {
      const timeoutId = setTimeout(() => {
        if (document.hasFocus()) {
          createNotification?.("All changes saved successfully", NotificationType.Notification);
        }
        operationsInitiatedRef.current = false;
      }, 500);

      return () => clearTimeout(timeoutId);
    }

    previousOperationsRef.current = currentHasOperations;
  }, [hasAnyOperations, createNotification]);

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
      // If we're editing, check if any edited units have peakLoadExclude set
      if (state.editing?.units && state.editing.units.length > 0) {
        const editedUnits = state.editing.units.filter((u: any) => u.peakLoadExclude !== undefined);
        if (editedUnits.length > 0) {
          // Return true if any edited unit excludes peak load
          return editedUnits.some((unit: any) => unit.peakLoadExclude);
        }
      }

      // Fall back to aggregating from original units
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
      // Update control fields - only send scalar fields that match ControlUpdateInput
      const controlUpdateData: any = {};

      if (state.editing.label !== undefined) {
        controlUpdateData.label = state.editing.label as string;
      }
      if (state.editing.correlation !== undefined) {
        controlUpdateData.correlation = state.editing.correlation as string;
      }

      if (Object.keys(controlUpdateData).length > 0) {
        updateControl({
          variables: {
            where: { id: state.editing.id },
            update: controlUpdateData,
          },
        });
      }

      // Update unit fields if they exist
      if (state.editing.units && state.editing.units.length > 0) {
        state.editing.units.forEach((editedUnit: any) => {
          if (editedUnit.id) {
            const updateData: any = {};

            // Only include scalar fields and ID references that match UnitUpdateInput
            Object.keys(editedUnit).forEach((key) => {
              if (key !== "id") {
                // Handle nested location object - extract locationId only
                if (key === "location" && editedUnit.location) {
                  if (editedUnit.location.id) {
                    updateData.locationId = editedUnit.location.id;
                  }
                  // Skip the location object itself
                } else if (key === "configuration" && editedUnit.configuration) {
                  // Handle nested configuration object - extract configurationId only
                  if (editedUnit.configuration.id) {
                    updateData.configurationId = editedUnit.configuration.id;
                  }
                  // Skip the configuration object itself
                } else if (key === "control" && editedUnit.control) {
                  // Handle nested control object - extract controlId only
                  if (editedUnit.control.id) {
                    updateData.controlId = editedUnit.control.id;
                  }
                  // Skip the control object itself
                } else if (typeof editedUnit[key] !== "object" || editedUnit[key] === null) {
                  // Only include scalar values (string, number, boolean, null)
                  updateData[key] = editedUnit[key];
                }
                // Skip any other nested objects that don't match the schema
              }
            });

            if (Object.keys(updateData).length > 0) {
              updateUnit({
                variables: {
                  where: { id: editedUnit.id },
                  update: { stage: Stage.Update.enum, ...updateData },
                },
              });
            }
          }
        });
      }
    }
  };

  const handlePush = useCallback(
    (control: any) => {
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
    },
    [updateControl],
  );

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

  const renderStatus = useCallback(
    (item: any) => {
      let icon: IconName = IconNames.ISSUE;
      let intent: Intent = Intent.WARNING;
      let message: string = "Push ILC Configuration";
      let isPushEnabled = false;

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
          isPushEnabled = !state.editing;
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
          isPushEnabled = !state.editing;
          break;
        case StageType.FailType.label:
          icon = IconNames.ERROR;
          intent = Intent.DANGER;
          message = "Configuration Failed";
          isPushEnabled = !state.editing;
          break;
        default:
          message = "Push ILC Configuration";
          isPushEnabled = !state.editing;
      }

      const notParticipating = item.peakLoadExclude;
      if (notParticipating) {
        icon = IconNames.DISABLE;
        intent = Intent.NONE;
        message = "Not Participating in Grid Services";
      }

      const isOperationPending = hasAnyOperations();

      if (item.units) {
        return (
          <Tooltip content={message} position={Position.TOP}>
            <Button
              icon={icon}
              intent={intent}
              minimal
              onClick={() => handlePush(item)}
              disabled={!isPushEnabled || isOperationPending}
              loading={isOperationPending}
            />
          </Tooltip>
        );
      } else {
        return (
          <Tooltip content={message} position={Position.TOP}>
            <Button icon={icon} intent={intent} minimal />
          </Tooltip>
        );
      }
    },
    [state.editing, hasAnyOperations, handlePush],
  );

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
                  <Tooltip
                    content={hasAnyOperations() ? "Saving..." : "Save"}
                    position={Position.TOP}
                    disabled={!isSave(control) || hasAnyOperations()}
                  >
                    <Button
                      icon={hasAnyOperations() ? IconNames.REFRESH : IconNames.FLOPPY_DISK}
                      intent={Intent.PRIMARY}
                      minimal
                      onClick={handleSave}
                      disabled={!isSave(control) || hasAnyOperations()}
                      loading={hasAnyOperations()}
                    />
                  </Tooltip>
                  <Tooltip content="Cancel" position={Position.TOP}>
                    <Button
                      icon={IconNames.CROSS}
                      intent={Intent.PRIMARY}
                      minimal
                      onClick={handleCancel}
                      disabled={hasAnyOperations()}
                    />
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
                      value={getValue("peakLoadExclude", control) ? "false" : "true"}
                      onChange={(e) => handleChange("peakLoadExclude")(e.target.value === "false")}
                      fill
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
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
                    <Unit
                      unit={unit}
                      editing={state.editing?.units?.find((v: any) => v?.id === unit.id) ?? null}
                      setEditing={(unitEditing) => {
                        setState((prev) => {
                          if (!prev.editing) return prev;

                          const updatedUnits = [...(prev.editing.units || [])];
                          const unitIndex = updatedUnits.findIndex((u: any) => u?.id === unit.id);

                          if (unitEditing === null) {
                            // Remove unit from editing if unitEditing is null
                            if (unitIndex >= 0) {
                              updatedUnits.splice(unitIndex, 1);
                            }
                          } else {
                            // Ensure the unit has an ID
                            const unitWithId = { ...unitEditing, id: unit.id };

                            if (unitIndex >= 0) {
                              // Update existing unit
                              updatedUnits[unitIndex] = unitWithId;
                            } else {
                              // Add new unit
                              updatedUnits.push(unitWithId);
                            }
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
                        // Get the control's peakLoadExclude value (from editing state or original control)
                        const controlPeakLoadExclude = getValue("peakLoadExclude", control);

                        // Get the unit's peakLoadExclude value (from editing state or original unit)
                        const editingUnit = state.editing?.units?.find((v: any) => v?.id === unit.id);
                        const unitPeakLoadExclude = editingUnit?.peakLoadExclude ?? (unit as any).peakLoadExclude;

                        return [
                          // Hide unit-level peakLoadExclude field since it's controlled at the control level
                          "peakLoadExclude",

                          // Hide grid services related fields if control or unit excludes peak load
                          ...(controlPeakLoadExclude || unitPeakLoadExclude
                            ? ["coolingPeakOffset", "heatingPeakOffset"]
                            : []),

                          // Always hide these advanced fields for ILC (they're for RTU configuration in setup page)
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
