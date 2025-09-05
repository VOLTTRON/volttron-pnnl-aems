"use client";

import styles from "./page.module.scss";
import {
  Button,
  Card,
  Collapse,
  ControlGroup,
  InputGroup,
  Intent,
  Label,
  Tree,
  Alert,
  Position,
  Tooltip,
} from "@blueprintjs/core";
import { useContext, useMemo, useState, useCallback } from "react";
import { useSubscription, useMutation } from "@apollo/client";
import {
  ReadUnitsQuery,
  StringFilterMode,
  UpdateUnitDocument,
  OrderBy,
  ModelStage,
  SubscribeUnitsDocument,
  SubscribeConfigurationsDocument,
} from "@/graphql-codegen/graphql";
import { CurrentContext, NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { filter } from "@/utils/client";
import { Search } from "../components/common";
import { IconNames } from "@blueprintjs/icons";
import { cloneDeep, get, isEqual, merge, set, isObject, isArray } from "lodash";
import { Setpoints } from "./components/Setpoints";
import { Schedules } from "./components/Schedules";
import { Holidays } from "./components/Holidays";
import { Occupancies } from "./components/Occupancies";
import { Unit } from "./components/Unit";
import { Role, HolidayType, DeepPartial } from "@local/common";

type UnitType = NonNullable<ReadUnitsQuery["readUnits"]>[0];

// Utility function to get common values across units (from deprecated app)
const getCommon = <T extends Record<string, any>>(objects: T[], excludeKeys: string[] = []): Partial<T> => {
  if (!objects || objects.length === 0) return {};

  const first = objects[0];
  const result: any = {};

  Object.keys(first).forEach((key) => {
    if (excludeKeys.includes(key)) return;

    const firstValue = first[key];
    const allSame = objects.every((obj) => {
      if (isObject(firstValue) && isObject(obj[key])) {
        return JSON.stringify(firstValue) === JSON.stringify(obj[key]);
      }
      return obj[key] === firstValue;
    });

    if (allSame) {
      result[key] = firstValue;
    } else {
      // Set to null when values differ to trigger indeterminate state
      result[key] = null;
    }
  });

  return result;
};

export default function Page() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<DeepPartial<UnitType> | null>(null);
  const [editingAll, setEditingAll] = useState<DeepPartial<UnitType> | null>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<(() => void) | null>(null);

  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);
  const { current } = useContext(CurrentContext);

  // Subscribe to units for real-time updates
  const { data, loading } = useSubscription(SubscribeUnitsDocument, {
    variables: {
      orderBy: { createdAt: OrderBy.Desc },
      where: {
        OR: [
          { label: { contains: search, mode: StringFilterMode.Insensitive } },
          { name: { contains: search, mode: StringFilterMode.Insensitive } },
          { campus: { contains: search, mode: StringFilterMode.Insensitive } },
          { building: { contains: search, mode: StringFilterMode.Insensitive } },
          { system: { contains: search, mode: StringFilterMode.Insensitive } },
        ],
      },
    },
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  // Subscribe to configurations for real-time updates
  const { data: configurationsData } = useSubscription(SubscribeConfigurationsDocument, {
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const [updateUnit] = useMutation(UpdateUnitDocument, {
    onError(error) {
      createNotification?.(error.message, NotificationType.Error);
    },
    onCompleted() {
      createNotification?.("Unit updated successfully", NotificationType.Notification);
    },
  });

  const units = useMemo(
    () => filter(data?.readUnits ?? [], search, ["label", "name", "campus", "building", "system"]),
    [data?.readUnits, search],
  );

  // Create default unit with common values for bulk editing
  const defaultUnit = useMemo(() => {
    if (!units || units.length === 0) return null;

    return {
      location: getCommon(
        units.map((u) => u.location ?? {}),
        ["id", "createdAt", "updatedAt"],
      ),
      configuration: {
        holidays: HolidayType.values.map((holidayType) =>
          getCommon(
            units.map((u) => u.configuration?.holidays?.find((h) => h?.label === holidayType.label) ?? {}),
            ["id", "createdAt", "updatedAt"],
          ),
        ),
        setpoint: getCommon(
          units.map((u) => u.configuration?.setpoint ?? {}),
          ["id", "createdAt", "updatedAt"],
        ),
      },
    };
  }, [units]);

  const getValue = useCallback(
    (field: string, editingUnit?: DeepPartial<UnitType> | null, unit?: UnitType) => {
      const temp = unit ? unit : units?.find((v) => v.id === editingUnit?.id);
      return get(editingUnit, field, get(temp, field));
    },
    [units],
  );

  const handleChange = useCallback(
    (field: string, editingUnit?: DeepPartial<UnitType> | null) => {
      return (value: string | number | boolean | object | null | undefined) => {
        if (editingUnit) {
          const newEditing = cloneDeep(editingUnit);
          if (typeof get(editingUnit, field) === "object" && value && typeof value === "object") {
            set(newEditing, field, merge(cloneDeep(get(editingUnit, field)), value));
          } else {
            set(newEditing, field, value);
          }

          if (editingUnit === editing) {
            setEditing(newEditing);
          } else if (editingUnit === editingAll) {
            setEditingAll(newEditing);
          }
        }
      };
    },
    [editing, editingAll],
  );

  const isSaveAll = useCallback(() => {
    if (!editingAll || !defaultUnit) return false;

    const temp = merge({}, defaultUnit, editingAll);
    return !isEqual(defaultUnit, temp);
  }, [editingAll, defaultUnit]);

  const isSave = useCallback(
    (unit: UnitType, editingUnit?: DeepPartial<UnitType> | null) => {
      editingUnit = editingUnit ?? editing;
      if (!editingUnit) return false;

      const temp = merge({}, unit, editingUnit);
      return !isEqual(unit, temp);
    },
    [editing],
  );

  const handleEdit = useCallback(
    (unit: UnitType) => {
      const current = editing && units?.find((v) => v.id === editing.id);
      if (current && isSave(current)) {
        setConfirm(() => () => setEditing({ id: unit.id }));
      } else {
        setEditing({ id: unit.id });
      }
    },
    [isSave, editing, units],
  );

  const handleCancel = useCallback(() => {
    const current = editing && units?.find((v) => v.id === editing.id);
    if (current && isSave(current)) {
      setConfirm(() => () => {
        setEditing(null);
        setExpanded(null);
      });
    } else {
      setEditing(null);
      setExpanded(null);
    }
  }, [isSave, editing, units]);

  const handleSave = useCallback(async () => {
    if (editing && editing.id) {
      const originalUnit = units?.find((u) => u.id === editing.id);
      if (originalUnit) {
        const updateData: any = {};

        // Only include scalar fields and ID references that match UnitUpdateInput
        Object.keys(editing).forEach((key) => {
          if (key !== "id" && !isEqual(get(editing, key), get(originalUnit, key))) {
            const value = get(editing, key);

            // Handle nested location object - extract locationId only
            if (key === "location" && value && typeof value === "object") {
              if (value.id) {
                updateData.locationId = value.id;
              }
              // Skip the location object itself
            } else if (key === "configuration" && value && typeof value === "object") {
              // Handle nested configuration object - extract configurationId only
              if (value.id) {
                updateData.configurationId = value.id;
              }
              // Skip the configuration object itself
            } else if (key === "control" && value && typeof value === "object") {
              // Handle nested control object - extract controlId only
              if (value.id) {
                updateData.controlId = value.id;
              }
              // Skip the control object itself
            } else if (typeof value !== "object" || value === null) {
              // Only include scalar values (string, number, boolean, null)
              updateData[key] = value;
            }
            // Skip any other nested objects that don't match the schema
          }
        });

        if (Object.keys(updateData).length > 0) {
          console.log("Updating unit with data:", { unitId: editing.id, updateData });
          await updateUnit({
            variables: {
              where: { id: editing.id },
              update: updateData,
            },
          });
        }
      }
      setEditing(null);
      setExpanded(null);
    }
  }, [editing, units, updateUnit]);

  const handlePush = useCallback(
    async (unit: UnitType) => {
      if (unit.id) {
        await updateUnit({
          variables: {
            where: { id: unit.id },
            update: { stage: ModelStage.Update },
          },
        });
      }
    },
    [updateUnit],
  );

  const handleClearAll = useCallback(() => {
    setEditingAll({});
    setExpanded(null);
  }, []);

  const handleSaveAll = useCallback(async () => {
    if (!editingAll || !units) return;

    try {
      // Apply changes to all units
      for (const unit of units) {
        if (!unit.id) continue;

        const updateData: any = {};

        // Handle location updates - extract locationId only
        if (editingAll.location) {
          const location = editingAll.location;
          if (location.id) {
            updateData.locationId = location.id;
          }
          // Skip the location object itself - UnitUpdateInput doesn't accept nested location objects
        }

        // Handle configuration updates - extract configurationId only
        if (editingAll.configuration) {
          const config = editingAll.configuration;
          if (config.id) {
            updateData.configurationId = config.id;
          }
          // Skip the configuration object itself - UnitUpdateInput doesn't accept nested configuration objects
        }

        // Handle other scalar fields from editingAll
        Object.keys(editingAll).forEach((key) => {
          if (key !== "id" && key !== "location" && key !== "configuration" && key !== "control") {
            const value = get(editingAll, key);
            if (typeof value !== "object" || value === null) {
              // Only include scalar values (string, number, boolean, null)
              updateData[key] = value;
            }
          }
        });

        // Only update if there are changes
        if (Object.keys(updateData).length > 0) {
          console.log("Bulk updating unit with data:", { unitId: unit.id, updateData });
          await updateUnit({
            variables: {
              where: { id: unit.id },
              update: updateData,
            },
          });
        }
      }

      createNotification?.("All units updated successfully", NotificationType.Notification);
      handleClearAll();
    } catch (error) {
      createNotification?.("Failed to update units", NotificationType.Error);
    }
  }, [editingAll, units, updateUnit, createNotification, handleClearAll]);

  const isPush = useCallback(
    (unit: UnitType) => {
      switch (unit.stage?.toLowerCase()) {
        case "update":
        case "delete":
        case "process":
          return false;
        case "create":
        case "complete":
        case "fail":
        default:
          return !isSave(unit);
      }
    },
    [isSave],
  );

  const renderStatus = useCallback(
    (unit: UnitType) => {
      let icon = IconNames.ISSUE;
      let intent: Intent = Intent.WARNING;
      let message = "Push Unit Configuration";

      switch (unit.stage?.toLowerCase()) {
        case "update":
          icon = IconNames.REFRESH;
          intent = Intent.PRIMARY;
          message = "Updating Configuration";
          break;
        case "process":
          icon = IconNames.REFRESH;
          intent = Intent.SUCCESS;
          message = "Processing Configuration";
          break;
        case "create":
          icon = IconNames.ISSUE;
          intent = Intent.WARNING;
          message = "Push Unit Configuration";
          break;
        case "delete":
          icon = IconNames.DELETE;
          intent = Intent.DANGER;
          message = "Deleting Configuration";
          break;
        case "complete":
          icon = IconNames.CONFIRM;
          intent = Intent.SUCCESS;
          message = "Configuration Complete";
          break;
        case "fail":
          icon = IconNames.ERROR;
          intent = Intent.DANGER;
          message = "Configuration Failed";
          break;
        default:
          icon = IconNames.ISSUE;
          intent = Intent.WARNING;
          message = "Push Unit Configuration";
      }

      return (
        <Tooltip content={message} position={Position.TOP} disabled={!isPush(unit)}>
          <Button icon={icon} intent={intent} minimal onClick={() => handlePush(unit)} disabled={!isPush(unit)} />
        </Tooltip>
      );
    },
    [isPush, handlePush],
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
        onConfirm={() => {
          confirm();
          setConfirm(null);
        }}
        onClose={() => setConfirm(null)}
      >
        <p>There are changes which have not been saved. Do you still want to continue?</p>
      </Alert>
    );
  };

  if (!Role.User.granted(...(current?.role?.split(" ") ?? []))) {
    return <div>You do not have permission to view this page.</div>;
  }

  return (
    <div className={styles.units}>
      <ControlGroup>
        <div className={styles.spacer} />
        <Search value={search} onValueChange={setSearch} />
      </ControlGroup>

      <h4> </h4>

      {/* Update All Units Card */}
      {defaultUnit && (
        <div className={styles.list}>
          <Card className={styles.unitCard}>
            <div className={styles.row}>
              <div>
                <Label>
                  <h3>Update All Units</h3>
                </Label>
              </div>
              <div className={styles.actions}>
                {isSaveAll() ? (
                  <>
                    <Tooltip content="Save All" position={Position.TOP}>
                      <Button icon={IconNames.FLOPPY_DISK} intent={Intent.PRIMARY} minimal onClick={handleSaveAll} />
                    </Tooltip>
                    <Tooltip content="Clear All" position={Position.TOP}>
                      <Button icon={IconNames.CROSS} intent={Intent.PRIMARY} minimal onClick={handleClearAll} />
                    </Tooltip>
                  </>
                ) : null}
              </div>
            </div>

            <Collapse isOpen={true}>
              <Tree
                contents={[
                  {
                    id: "holidays-all",
                    label: "Holidays",
                    icon: IconNames.TIMELINE_EVENTS,
                    hasCaret: true,
                    isExpanded: expanded === "holidays-all",
                  },
                ]}
                onNodeExpand={(e) => setExpanded(e.id as string)}
                onNodeCollapse={() => setExpanded(null)}
                onNodeClick={(e) => setExpanded(e.id === expanded ? null : (e.id as string))}
              />
              <Collapse isOpen={expanded === "holidays-all"}>
                <div className={styles.configSection}>
                  <Holidays
                    unit={defaultUnit}
                    editing={editingAll}
                    handleChange={handleChange}
                    readOnly={false}
                    bulkUpdate={true}
                  />
                </div>
              </Collapse>

              <Tree
                contents={[
                  {
                    id: "rtu-all",
                    label: "RTU Configuration",
                    icon: IconNames.COG,
                    hasCaret: true,
                    isExpanded: expanded === "rtu-all",
                  },
                ]}
                onNodeExpand={(e) => setExpanded(e.id as string)}
                onNodeCollapse={() => setExpanded(null)}
                onNodeClick={(e) => setExpanded(e.id === expanded ? null : (e.id as string))}
              />
              <Collapse isOpen={expanded === "rtu-all"}>
                <div className={styles.configSection}>
                  <Unit unit={defaultUnit} editing={editingAll} handleChange={handleChange} />
                </div>
              </Collapse>
            </Collapse>
          </Card>
        </div>
      )}

      <h1>Units</h1>

      <div className={styles.list}>
        {units?.map((unit, i) => {
          const isEditing = unit.id === editing?.id;
          const currentUnit = (isEditing ? units.find((u) => u.id === editing?.id) : unit) || null;

          return (
            <Card key={unit.id ?? i} className={styles.unitCard}>
              <div className={styles.row}>
                <div>
                  <Label>
                    <h3>{unit.label || unit.name}</h3>
                  </Label>
                </div>
                <div className={styles.actions}>
                  {renderStatus(unit)}
                  {isEditing ? (
                    <>
                      <Tooltip content="Save" position={Position.TOP} disabled={!isSave(unit)}>
                        <Button
                          icon={IconNames.FLOPPY_DISK}
                          intent={Intent.PRIMARY}
                          minimal
                          onClick={handleSave}
                          disabled={!isSave(unit)}
                        />
                      </Tooltip>
                      <Tooltip content="Cancel" position={Position.TOP}>
                        <Button icon={IconNames.CROSS} intent={Intent.PRIMARY} minimal onClick={handleCancel} />
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <Tooltip content="Edit" position={Position.TOP}>
                        <Button
                          icon={IconNames.EDIT}
                          intent={Intent.PRIMARY}
                          minimal
                          onClick={() => handleEdit(unit)}
                        />
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>

              {isEditing && (
                <>
                  <div className={styles.row}>
                    <div>
                      <Label>
                        <b>Campus</b>
                        <InputGroup
                          type="text"
                          value={getValue("campus", editing, currentUnit || undefined) || ""}
                          onChange={(e) => handleChange("campus", editing)(e.target.value)}
                          readOnly
                        />
                      </Label>
                    </div>
                    <div>
                      <Label>
                        <b>Building</b>
                        <InputGroup
                          type="text"
                          value={getValue("building", editing, currentUnit || undefined) || ""}
                          onChange={(e) => handleChange("building", editing)(e.target.value)}
                          readOnly
                        />
                      </Label>
                    </div>
                    <div>
                      <Label>
                        <b>System</b>
                        <InputGroup
                          type="text"
                          value={getValue("system", editing, currentUnit || undefined) || ""}
                          onChange={(e) => handleChange("system", editing)(e.target.value)}
                          readOnly
                        />
                      </Label>
                    </div>
                    <div>
                      <Label>
                        <b>Timezone</b>
                        <InputGroup
                          type="text"
                          value={getValue("timezone", editing, currentUnit || undefined) || ""}
                          onChange={(e) => handleChange("timezone", editing)(e.target.value)}
                          readOnly
                        />
                      </Label>
                    </div>
                  </div>

                  <Collapse isOpen={true}>
                    <Tree
                      contents={[
                        {
                          id: "configuration",
                          label: "Configuration",
                          icon: IconNames.SERIES_CONFIGURATION,
                          hasCaret: true,
                          isExpanded: expanded === "configuration",
                        },
                      ]}
                      onNodeExpand={(e) => setExpanded(e.id as string)}
                      onNodeCollapse={() => setExpanded(null)}
                      onNodeClick={(e) => setExpanded(e.id === expanded ? null : (e.id as string))}
                    />
                    <Collapse isOpen={expanded === "configuration"}>
                      <div className={styles.configSection}>
                        <Label>
                          <b>Configuration Label</b>
                          <InputGroup
                            type="text"
                            value={getValue("configuration.label", editing, currentUnit || undefined) || ""}
                            onChange={(e) => handleChange("configuration.label", editing)(e.target.value)}
                          />
                        </Label>
                      </div>
                    </Collapse>

                    <Tree
                      contents={[
                        {
                          id: "setpoints",
                          label: "Setpoints",
                          icon: IconNames.TEMPERATURE,
                          hasCaret: true,
                          isExpanded: expanded === "setpoints",
                        },
                      ]}
                      onNodeExpand={(e) => setExpanded(e.id as string)}
                      onNodeCollapse={() => setExpanded(null)}
                      onNodeClick={(e) => setExpanded(e.id === expanded ? null : (e.id as string))}
                    />
                    <Collapse isOpen={expanded === "setpoints"}>
                      <div className={styles.configSection}>
                        <Setpoints unit={currentUnit} editing={editing} handleChange={handleChange} />
                      </div>
                    </Collapse>

                    <Tree
                      contents={[
                        {
                          id: "schedules",
                          label: "Occupancy Schedules",
                          icon: IconNames.TIME,
                          hasCaret: true,
                          isExpanded: expanded === "schedules",
                        },
                      ]}
                      onNodeExpand={(e) => setExpanded(e.id as string)}
                      onNodeCollapse={() => setExpanded(null)}
                      onNodeClick={(e) => setExpanded(e.id === expanded ? null : (e.id as string))}
                    />
                    <Collapse isOpen={expanded === "schedules"}>
                      <div className={styles.configSection}>
                        <Schedules unit={currentUnit} editing={editing} handleChange={handleChange} />
                      </div>
                    </Collapse>

                    <Tree
                      contents={[
                        {
                          id: "holidays",
                          label: "Holidays",
                          icon: IconNames.TIMELINE_EVENTS,
                          hasCaret: true,
                          isExpanded: expanded === "holidays",
                        },
                      ]}
                      onNodeExpand={(e) => setExpanded(e.id as string)}
                      onNodeCollapse={() => setExpanded(null)}
                      onNodeClick={(e) => setExpanded(e.id === expanded ? null : (e.id as string))}
                    />
                    <Collapse isOpen={expanded === "holidays"}>
                      <div className={styles.configSection}>
                        <Holidays unit={currentUnit} editing={editing} handleChange={handleChange} />
                      </div>
                    </Collapse>

                    <Tree
                      contents={[
                        {
                          id: "occupancies",
                          label: "Temporary Occupancy",
                          icon: IconNames.HOME,
                          hasCaret: true,
                          isExpanded: expanded === "occupancies",
                        },
                      ]}
                      onNodeExpand={(e) => setExpanded(e.id as string)}
                      onNodeCollapse={() => setExpanded(null)}
                      onNodeClick={(e) => setExpanded(e.id === expanded ? null : (e.id as string))}
                    />
                    <Collapse isOpen={expanded === "occupancies"}>
                      <div className={styles.configSection}>
                        <Occupancies unit={currentUnit} editing={editing} handleChange={handleChange} />
                      </div>
                    </Collapse>

                    <Tree
                      contents={[
                        {
                          id: "rtu",
                          label: "RTU Configuration",
                          icon: IconNames.COG,
                          hasCaret: true,
                          isExpanded: expanded === "rtu",
                        },
                      ]}
                      onNodeExpand={(e) => setExpanded(e.id as string)}
                      onNodeCollapse={() => setExpanded(null)}
                      onNodeClick={(e) => setExpanded(e.id === expanded ? null : (e.id as string))}
                    />
                    <Collapse isOpen={expanded === "rtu"}>
                      <div className={styles.configSection}>
                        <Unit unit={currentUnit} editing={editing} handleChange={handleChange} />
                      </div>
                    </Collapse>
                  </Collapse>
                </>
              )}
            </Card>
          );
        })}
      </div>

      {renderConfirm()}
    </div>
  );
}
