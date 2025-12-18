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
import { useContext, useMemo, useState, useCallback } from "react";
import { useSubscription, useQuery } from "@apollo/client";
import {
  ReadControlsQuery,
  UpdateControlDocument,
  UpdateUnitDocument,
  OrderBy,
  SubscribeControlsDocument,
  ReadControlsDocument,
  CreateLocationDocument,
  DeleteLocationDocument,
} from "@/graphql-codegen/graphql";
import { CurrentContext, NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { Term } from "@/utils/client";
import { Unit } from "./components/Unit";
import { Role, Stage, StageType } from "@local/common";
import { useOperationManager } from "../components/hooks/useOperationManager";
import { useMutationWithTracking } from "../components/hooks/useMutationWithTracking";
import { omit, cloneDeep, merge } from "lodash";

export default function ILCPage() {
  const [editing, setEditing] = useState<Partial<Term<NonNullable<ReadControlsQuery["readControls"]>[0]>> | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<(() => void) | null>(null);

  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);
  const { current } = useContext(CurrentContext);
  const { hasAnyOperations, waitForAllOperations } = useOperationManager();

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

  const { data: subscribed } = useSubscription(SubscribeControlsDocument, {
    variables: {
      orderBy: { createdAt: OrderBy.Desc },
    },
    onError(error) {
      startPolling(5000);
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

  const [createLocation] = useMutationWithTracking(CreateLocationDocument, {
    operationType: "location",
    getDescription: (variables) => `Create location ${variables?.create?.name}`,
    onError: (error: any) => createNotification?.(error.message, NotificationType.Error),
  });

  const [deleteLocation] = useMutationWithTracking(DeleteLocationDocument, {
    operationType: "location",
    getEntityId: (variables) => variables?.where?.id,
    getDescription: (variables) => `Delete location ${variables?.where?.id}`,
    onError: (error: any) => createNotification?.(error.message, NotificationType.Error),
  });

  const controls = useMemo(() => data?.readControls ?? [], [data?.readControls]);

  const handleEdit = (control: Term<NonNullable<ReadControlsQuery["readControls"]>[0]>) => {
    const current = editing && controls?.find((v) => v.id === editing?.id);
    if (current && isSave(current)) {
      setConfirm(
        () => () =>
          setEditing({
            id: control.id,
            label: control.label,
            correlation: control.correlation,
            units: control.units?.map((v) => ({ id: v.id })) || [],
          }),
      );
    } else {
      setEditing({
        id: control.id,
        label: control.label,
        correlation: control.correlation,
        units: control.units?.map((v) => ({ id: v.id })) || [],
      });
    }
  };

  const handleCancel = () => {
    const current = editing && controls?.find((v) => v.id === editing?.id);
    if (current && isSave(current)) {
      setConfirm(() => () => setEditing(null));
    } else {
      setEditing(null);
    }
  };

  const handleConfirm = () => {
    if (confirm) {
      confirm();
      setConfirm(null);
    }
  };

  const handleSave = async () => {
    if (editing?.id) {
      const operations: Promise<any>[] = [];
      const controlUpdateData: any = {};

      if (editing.label !== undefined) {
        controlUpdateData.label = editing.label as string;
      }

      if (editing.units && editing.units.length > 0) {
        for (const editedUnit of editing.units) {
          if (editedUnit.id) {
            const originalControl = controls?.find((c) => c.id === editing?.id);
            const originalUnit = originalControl?.units?.find((u: any) => u.id === editedUnit.id);

            const location = editedUnit.location;
            if (location) {
              if (originalUnit?.location?.id) {
                operations.push(
                  deleteLocation({
                    variables: { where: { id: originalUnit.location.id } },
                  }),
                );
              }
              operations.push(
                createLocation({
                  variables: {
                    create: {
                      name: location.name ?? "",
                      latitude: location.latitude ?? 0,
                      longitude: location.longitude ?? 0,
                      units: { connect: [{ id: editedUnit.id }] },
                    },
                  },
                }),
              );
            }

            const updateData = omit(editedUnit, ["id", "location"]);
            if (Object.keys(updateData).length > 0) {
              operations.push(
                updateUnit({
                  variables: {
                    where: { id: editedUnit.id },
                    update: { stage: Stage.Update.enum, ...updateData },
                  },
                }),
              );
            }
          }
        }
      }

      // Update control if there are changes
      if (Object.keys(controlUpdateData).length > 0) {
        operations.push(
          updateControl({
            variables: {
              where: { id: editing.id },
              update: { stage: Stage.Update.enum, ...controlUpdateData },
            },
          }),
        );
      }

      // Wait for all operations to complete
      await Promise.allSettled(operations);
      createNotification?.("All changes saved successfully", NotificationType.Notification);
      setEditing(null);
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
    if (!editing) return false;
    const original = controls.find((c) => c.id === control.id);

    // Check control-level changes
    const controlChanged = editing.label !== original?.label || editing.correlation !== original?.correlation;

    // Check unit-level changes
    let unitsChanged = false;
    if (editing.units && editing.units.length > 0) {
      unitsChanged = editing.units.some((editedUnit: any) => {
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
          isPushEnabled = !editing;
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
          isPushEnabled = !editing;
          break;
        case StageType.FailType.label:
          icon = IconNames.ERROR;
          intent = Intent.DANGER;
          message = "Configuration Failed";
          isPushEnabled = !editing;
          break;
        default:
          message = "Push ILC Configuration";
          isPushEnabled = !editing;
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
    [editing, hasAnyOperations, handlePush],
  );

  const renderConfirm = () => {
    if (confirm === null) {
      return null;
    }
    return (
      <Alert
        intent={Intent.DANGER}
        isOpen={true}
        confirmButtonText="Yes"
        cancelButtonText="Cancel"
        onConfirm={handleConfirm}
        onClose={() => setConfirm(null)}
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
          const isEditing = control.id === editing?.id;

          const value = merge({}, control, editing);
          const { units, label } = value;
          const { campus, building } = units?.[0] ?? {};
          const peakLoadExclude = units?.every((u) => u.peakLoadExclude === true)
            ? "true"
            : units?.every((u) => u.peakLoadExclude === false)
            ? "false"
            : "mixed";

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
                    <InputGroup type="text" value={campus ?? ""} readOnly />
                  </Label>
                </div>
                <div>
                  <Label>
                    <b>Building</b>
                    <InputGroup type="text" value={building ?? ""} readOnly />
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
                      value={label ?? ""}
                      onChange={(e) => {
                        const clone = cloneDeep(editing ?? {});
                        clone.label = e.target.value;
                        setEditing(clone);
                      }}
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
                      value={peakLoadExclude}
                      onChange={(e) => {
                        const peakLoadExclude = e.target.value;
                        const clone = cloneDeep(editing ?? {});
                        clone.units = (control.units || []).map((u: any) => {
                          const existing = clone.units?.find((eu: any) => eu?.id === u.id) || {};
                          switch (peakLoadExclude) {
                            case "true":
                              return { ...existing, id: u.id, peakLoadExclude: true };
                            case "false":
                              return { ...existing, id: u.id, peakLoadExclude: false };
                            case "mixed":
                            default:
                              delete existing.peakLoadExclude;
                              return existing;
                          }
                        });
                        setEditing(clone);
                      }}
                      fill
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                      <option value="mixed">Mixed</option>
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
                        isExpanded: expanded === `${control.id}-${unit.id}`,
                      },
                    ]}
                    onNodeExpand={() => setExpanded(`${control.id}-${unit.id}`)}
                    onNodeCollapse={() => setExpanded(null)}
                    onNodeClick={() =>
                      setExpanded(`${control.id}-${unit.id}` === expanded ? null : `${control.id}-${unit.id}`)
                    }
                  />
                  <Collapse isOpen={expanded === `${control.id}-${unit.id}`}>
                    <Unit
                      unit={unit}
                      editing={editing?.units?.find((v: any) => v?.id === unit.id) ?? null}
                      setEditing={(unitEditing) => {
                        if (!editing) return;

                        const clone = cloneDeep(editing);
                        const updatedUnits = [...(clone.units || [])];
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

                        clone.units = updatedUnits;
                        setEditing(clone);
                      }}
                      hidden={(() => {
                        // Get the unit's peakLoadExclude value (from editing state or original unit)
                        const editingUnit = editing?.units?.find((v: any) => v?.id === unit.id);
                        const unitPeakLoadExclude = editingUnit?.peakLoadExclude ?? (unit as any).peakLoadExclude;

                        return [
                          // Hide unit-level peakLoadExclude field since it's controlled at the control level
                          "peakLoadExclude",

                          // Hide grid services related fields if control or unit excludes peak load
                          ...(unitPeakLoadExclude ? ["coolingPeakOffset", "heatingPeakOffset"] : []),

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
