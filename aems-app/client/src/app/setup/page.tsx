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
  ButtonVariant,
  AnchorButton,
} from "@blueprintjs/core";
import { useContext, useMemo, useState, useCallback } from "react";
import { useSubscription, useQuery } from "@apollo/client";
import { useOperationManager } from "../components/hooks/useOperationManager";
import { useMutationWithTracking } from "../components/hooks/useMutationWithTracking";
import {
  ReadUnitsQuery,
  StringFilterMode,
  UpdateUnitDocument,
  CreateHolidayDocument,
  UpdateHolidayDocument,
  DeleteHolidayDocument,
  CreateOccupancyDocument,
  UpdateOccupancyDocument,
  DeleteOccupancyDocument,
  OrderBy,
  ModelStage,
  SubscribeUnitsDocument,
  HolidayType as HolidayEnum,
  ReadUnitsDocument,
  CreateLocationDocument,
  UpdateLocationDocument,
  DeleteLocationDocument,
} from "@/graphql-codegen/graphql";
import { CurrentContext, NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { filter } from "@/utils/client";
import { Search } from "../components/common";
import { IconNames } from "@blueprintjs/icons";
import { cloneDeep, isEqual, merge, omit, pick, uniqWith } from "lodash";
import { Setpoint } from "./components/Setpoint";
import { Schedules } from "./components/Schedules";
import { Holidays } from "./components/Holidays";
import { Occupancies, OccupancyCreateDelete } from "./components/Occupancies";
import { Unit } from "./components/Unit";
import { Role, DeepPartial, typeofNonNullable, typeofObject } from "@local/common";
import { HolidayCreateDelete } from "./components/Holiday";
import { Location } from "./components/Location";

type UnitModel = NonNullable<ReadUnitsQuery["readUnits"]>[number];

function allUnit(units: UnitModel[]): Partial<UnitModel> | null {
  const unit = units[0];
  if (!unit) {
    return null;
  }
  const location = units.every((u) =>
    isEqual(
      pick(u.location, ["name", "latitude", "longitude"]),
      pick(unit.location, ["name", "latitude", "longitude"]),
    ),
  )
    ? cloneDeep(unit.location)
    : undefined;
  const holidays = cloneDeep(
    unit.configuration?.holidays?.filter(typeofNonNullable).filter((v) => v.type !== HolidayEnum.Custom) ?? [],
  );
  holidays.forEach(
    (v) =>
      (v.type = units.every((u) => u.configuration?.holidays?.find((h) => h.label === v.label)?.type === v.type)
        ? v.type
        : null),
  );
  return {
    id: unit.id,
    location,
    configuration: {
      id: unit.configuration?.id,
      holidays,
    },
  };
}

export default function Page() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<DeepPartial<UnitModel> | null>(null);
  const [editingAll, setEditingAll] = useState<DeepPartial<UnitModel | null>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<(() => void) | null>(null);
  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);
  const { current } = useContext(CurrentContext);
  const { hasAnyOperations, waitForAllOperations } = useOperationManager();

  const { data: queried, startPolling } = useQuery(ReadUnitsDocument, {
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

  const { data: subscribed } = useSubscription(SubscribeUnitsDocument, {
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
      startPolling(5000);
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const data = subscribed ?? queried;

  const [updateUnit] = useMutationWithTracking(UpdateUnitDocument, {
    operationType: "unit",
    getEntityId: (variables) => variables?.where?.id,
    getDescription: (variables) => `Update unit ${variables?.where?.id}`,
    onError: (error) => createNotification?.(error.message, NotificationType.Error),
  });

  const [createHoliday] = useMutationWithTracking(CreateHolidayDocument, {
    operationType: "holiday",
    getDescription: (variables) => `Create holiday ${variables?.create?.label}`,
    onError: (error) => {
      console.error(error);
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const [updateHoliday] = useMutationWithTracking(UpdateHolidayDocument, {
    operationType: "holiday",
    getEntityId: (variables) => variables?.where?.id,
    getDescription: (variables) => `Update holiday ${variables?.where?.id}`,
    onError: (error) => createNotification?.(error.message, NotificationType.Error),
  });

  const [deleteHoliday] = useMutationWithTracking(DeleteHolidayDocument, {
    operationType: "holiday",
    getEntityId: (variables) => variables?.where?.id,
    getDescription: (variables) => `Delete holiday ${variables?.where?.id}`,
    onError: (error) => createNotification?.(error.message, NotificationType.Error),
  });

  const [createOccupancy] = useMutationWithTracking(CreateOccupancyDocument, {
    operationType: "occupancy",
    getDescription: (variables) => `Create occupancy ${variables?.create?.label}`,
    onError: (error) => createNotification?.(error.message, NotificationType.Error),
  });

  const [updateOccupancy] = useMutationWithTracking(UpdateOccupancyDocument, {
    operationType: "occupancy",
    getEntityId: (variables) => variables?.where?.id,
    getDescription: (variables) => `Update occupancy ${variables?.where?.id}`,
    onError: (error) => createNotification?.(error.message, NotificationType.Error),
  });

  const [deleteOccupancy] = useMutationWithTracking(DeleteOccupancyDocument, {
    operationType: "occupancy",
    getEntityId: (variables) => variables?.where?.id,
    getDescription: (variables) => `Delete occupancy ${variables?.where?.id}`,
    onError: (error) => createNotification?.(error.message, NotificationType.Error),
  });

  const [createLocation] = useMutationWithTracking(CreateLocationDocument, {
    operationType: "location",
    getDescription: (variables) => `Create location ${variables?.create?.name}`,
    onError: (error) => createNotification?.(error.message, NotificationType.Error),
  });

  const [updateLocation] = useMutationWithTracking(UpdateLocationDocument, {
    operationType: "location",
    getEntityId: (variables) => variables?.where?.id,
    getDescription: (variables) => `Update location ${variables?.where?.id}`,
    onError: (error) => createNotification?.(error.message, NotificationType.Error),
  });

  const [deleteLocation] = useMutationWithTracking(DeleteLocationDocument, {
    operationType: "location",
    getEntityId: (variables) => variables?.where?.id,
    getDescription: (variables) => `Delete location ${variables?.where?.id}`,
    onError: (error) => createNotification?.(error.message, NotificationType.Error),
  });

  const { units, groups } = useMemo(() => {
    const units = filter([...(data?.readUnits ?? [])], search, ["label", "name", "campus", "building", "system"]).sort(
      (a, b) =>
        (a.campus || "").localeCompare(b.campus || "") ||
        (a.building || "").localeCompare(b.building || "") ||
        (a.system || "").localeCompare(b.system || ""),
    );
    const groups = uniqWith(
      units.map((v) => ({ campus: v.campus ?? "", building: v.building ?? "" })),
      isEqual,
    );
    return { units, groups };
  }, [data?.readUnits, search]);

  const all = useMemo(() => {
    const values = data?.readUnits ?? [];
    return values.length > 0 ? allUnit(values) : null;
  }, [data?.readUnits]);

  const handleUpdateUnit = useCallback(
    async (updated: DeepPartial<UnitModel>) => {
      const unit = data?.readUnits?.find((u) => u.id === updated.id) ?? null;
      if (!unit) {
        createNotification?.("Unit not found", NotificationType.Error);
        return;
      }

      // Ensure configuration ID is set
      if (updated.configuration) {
        updated.configuration.id = updated.configuration.id ?? unit.configuration?.id;
      }

      const operations: Promise<any>[] = [];

      // Handle location updates
      const location = updated?.location;
      if (location) {
        if (unit.location?.id) {
          operations.push(
            deleteLocation({
              variables: { where: { id: unit.location.id } },
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
                units: { connect: [{ id: updated.id ?? "" }] },
              },
            },
          }),
        );
      }

      // Handle holiday updates
      updated.configuration?.holidays?.filter(typeofNonNullable).forEach((holiday) => {
        const action = typeofObject<HolidayCreateDelete>(holiday, (v) => v.action) ? holiday.action : "update";
        switch (action) {
          case "create":
            operations.push(
              createHoliday({
                variables: {
                  create: {
                    label: holiday.label ?? "",
                    type: HolidayEnum.Custom,
                    day: holiday.day ?? 0,
                    month: holiday.month ?? 0,
                    observance: holiday.observance ?? null,
                    configurations: { connect: [{ id: updated.configuration?.id ?? "" }] },
                  },
                },
              }),
            );
            break;
          case "update":
            operations.push(
              updateHoliday({
                variables: { update: omit(holiday, ["id", "action"]), where: { id: holiday.id } },
              }),
            );
            break;
          case "delete":
            operations.push(
              deleteHoliday({
                variables: { where: { id: holiday.id ?? "" } },
              }),
            );
            break;
          default:
            createNotification?.(`Unknown holiday action: ${action}`, NotificationType.Error);
        }
      });

      // Handle occupancy updates
      updated.configuration?.occupancies?.filter(typeofNonNullable).forEach((occupancy) => {
        const action = typeofObject<OccupancyCreateDelete>(occupancy, (v) => v.action) ? occupancy.action : "update";
        switch (action) {
          case "create":
            operations.push(
              createOccupancy({
                variables: {
                  create: {
                    label: occupancy.label ?? "",
                    date: occupancy.date ? new Date(occupancy.date).toISOString() : new Date().toISOString(),
                    schedule: {
                      create: {
                        label: occupancy.schedule?.label ?? "",
                        endTime: occupancy.schedule?.endTime ?? "00:00",
                        startTime: occupancy.schedule?.startTime ?? "00:00",
                        occupied: occupancy.schedule?.occupied ?? false,
                      },
                    },
                    configuration: { connect: { id: updated.configuration?.id ?? "" } },
                  },
                },
              }),
            );
            break;
          case "update":
            operations.push(
              updateOccupancy({
                variables: {
                  update: { ...omit(occupancy, ["action", "schedule"]), schedule: { update: occupancy.schedule } },
                  where: { id: occupancy.id },
                },
              }),
            );
            break;
          case "delete":
            operations.push(
              deleteOccupancy({
                variables: { where: { id: occupancy.id ?? "" } },
              }),
            );
            break;
          default:
            createNotification?.(`Unknown occupancy action: ${action}`, NotificationType.Error);
        }
      });

      // Handle unit update
      operations.push(
        updateUnit({
          variables: {
            update: {
              stage: ModelStage.Update,
              ...(updated ? omit(updated, ["id", "location", "configuration"]) : {}),
              ...(updated.configuration
                ? {
                    configuration: {
                      update: {
                        ...omit(updated.configuration, [
                          "id",
                          "setpoint",
                          "holidays",
                          "occupancies",
                          "mondaySchedule",
                          "tuesdaySchedule",
                          "wednesdaySchedule",
                          "thursdaySchedule",
                          "fridaySchedule",
                          "saturdaySchedule",
                          "sundaySchedule",
                          "holidaySchedule",
                        ]),
                        ...(updated.configuration.setpoint
                          ? { setpoint: { update: omit(updated.configuration.setpoint, ["id"]) } }
                          : {}),
                        ...(updated.configuration.mondaySchedule
                          ? { mondaySchedule: { update: omit(updated.configuration.mondaySchedule, ["id"]) } }
                          : {}),
                        ...(updated.configuration.tuesdaySchedule
                          ? { tuesdaySchedule: { update: omit(updated.configuration.tuesdaySchedule, ["id"]) } }
                          : {}),
                        ...(updated.configuration.wednesdaySchedule
                          ? { wednesdaySchedule: { update: omit(updated.configuration.wednesdaySchedule, ["id"]) } }
                          : {}),
                        ...(updated.configuration.thursdaySchedule
                          ? { thursdaySchedule: { update: omit(updated.configuration.thursdaySchedule, ["id"]) } }
                          : {}),
                        ...(updated.configuration.fridaySchedule
                          ? { fridaySchedule: { update: omit(updated.configuration.fridaySchedule, ["id"]) } }
                          : {}),
                        ...(updated.configuration.saturdaySchedule
                          ? { saturdaySchedule: { update: omit(updated.configuration.saturdaySchedule, ["id"]) } }
                          : {}),
                        ...(updated.configuration.sundaySchedule
                          ? { sundaySchedule: { update: omit(updated.configuration.sundaySchedule, ["id"]) } }
                          : {}),
                        ...(updated.configuration.holidaySchedule
                          ? { holidaySchedule: { update: omit(updated.configuration.holidaySchedule, ["id"]) } }
                          : {}),
                      },
                    },
                  }
                : {}),
            },
            where: { id: updated.id },
          },
        }),
      );

      // Wait for all operations to complete
      await Promise.allSettled(operations);
    },
    [
      data,
      updateUnit,
      createNotification,
      createHoliday,
      updateHoliday,
      deleteHoliday,
      createOccupancy,
      updateOccupancy,
      deleteOccupancy,
      createLocation,
      deleteLocation,
    ],
  );

  const handleSave = async () => {
    if (editing?.id) {
      await handleUpdateUnit(editing);
      createNotification?.("All changes saved successfully", NotificationType.Notification);
      setEditing(null);
    }
  };

  const updateIds = (unit: UnitModel, editingAll: DeepPartial<UnitModel | null>): DeepPartial<UnitModel> => {
    const clone = cloneDeep(editingAll);

    // Return empty object if clone is null
    if (!clone) {
      return {};
    }

    // Handle location ID matching
    if (clone.location && unit.location) {
      clone.location.id = unit.location.id;
    }

    // Handle holiday ID matching by label
    if (clone.configuration?.holidays) {
      clone.configuration.holidays = clone.configuration.holidays.map((editingHoliday) => {
        if (
          editingHoliday &&
          (editingHoliday.type === HolidayEnum.Enabled || editingHoliday.type === HolidayEnum.Disabled)
        ) {
          // Find matching holiday in unit by label
          const matchingHoliday = unit.configuration?.holidays?.find(
            (unitHoliday) => unitHoliday?.label === editingHoliday.label,
          );
          if (matchingHoliday) {
            return { ...editingHoliday, id: matchingHoliday.id };
          }
        }
        return editingHoliday;
      });
    }

    return clone;
  };

  const handleSaveAll = async () => {
    if (!isEqual(editingAll, {}) && editingAll) {
      try {
        // Pre-process editingAll to add holiday labels from the first unit
        const firstUnit = units[0];
        let updatedEditingAll = editingAll;

        if (firstUnit && editingAll.configuration?.holidays) {
          updatedEditingAll = cloneDeep(editingAll);
          if (updatedEditingAll && updatedEditingAll.configuration?.holidays) {
            updatedEditingAll.configuration.holidays = updatedEditingAll.configuration.holidays.map(
              (editingHoliday) => {
                if (
                  editingHoliday &&
                  editingHoliday.id &&
                  (editingHoliday.type === HolidayEnum.Enabled || editingHoliday.type === HolidayEnum.Disabled)
                ) {
                  // Find matching holiday in first unit by ID
                  const matchingHoliday = firstUnit.configuration?.holidays?.find(
                    (unitHoliday) => unitHoliday?.id === editingHoliday.id,
                  );
                  if (matchingHoliday) {
                    return { ...editingHoliday, label: matchingHoliday.label };
                  }
                }
                return editingHoliday;
              },
            );
          }
        }

        // Process all units in parallel
        const updatePromises = units.map((unit) =>
          handleUpdateUnit({ id: unit.id, ...updateIds(unit, updatedEditingAll) }),
        );

        // Wait for all updates to complete
        await Promise.allSettled(updatePromises);
        createNotification?.("All changes saved successfully", NotificationType.Notification);

        // Clear editing state after all operations complete
        setEditingAll({});
      } catch (error) {
        createNotification?.("Some operations failed during bulk save", NotificationType.Error);
      }
    }
  };

  const renderStatus = useCallback(
    (unit: UnitModel) => {
      let icon = IconNames.ISSUE;
      let intent: Intent = Intent.WARNING;
      let message = "Push Unit Configuration";
      let isPush = false;

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
          isPush = !editing;
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
          isPush = !editing;
          break;
        case "fail":
          icon = IconNames.ERROR;
          intent = Intent.DANGER;
          message = "Configuration Failed";
          isPush = !editing;
          break;
        default:
          icon = IconNames.ISSUE;
          intent = Intent.WARNING;
          message = "Push Unit Configuration";
      }

      const handlePush = () => {
        updateUnit({ variables: { update: { stage: ModelStage.Update }, where: { id: unit.id } } });
      };

      const isOperationPending = hasAnyOperations();

      return (
        <Tooltip content={message} position={Position.TOP}>
          <Button icon={icon} intent={intent} minimal onClick={handlePush} disabled={!isPush || isOperationPending} />
        </Tooltip>
      );
    },
    [updateUnit, editing, hasAnyOperations],
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

      <div className={styles.list}>
        <Card className={styles.unitCard}>
          <div className={styles.row}>
            <div>
              <Label>
                <h3>Update All Units</h3>
              </Label>
            </div>
            <div className={styles.actions}>
              {!isEqual(editingAll, {}) ? (
                <>
                  <Tooltip content="Save All" position={Position.TOP}>
                    <Button
                      icon={hasAnyOperations() ? IconNames.REFRESH : IconNames.FLOPPY_DISK}
                      intent={Intent.PRIMARY}
                      minimal
                      onClick={handleSaveAll}
                      disabled={hasAnyOperations()}
                      loading={hasAnyOperations()}
                    />
                  </Tooltip>
                  <Tooltip content="Clear All" position={Position.TOP}>
                    <Button
                      icon={IconNames.CROSS}
                      intent={Intent.PRIMARY}
                      minimal
                      onClick={() => setEditingAll({})}
                      disabled={hasAnyOperations()}
                    />
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
                  unit={all}
                  editing={editingAll}
                  setEditing={setEditingAll}
                  readOnly={false}
                  hideCustom={true}
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
                <Location unit={all} editing={editingAll} setEditing={setEditingAll} readOnly={false} />
              </div>
            </Collapse>
          </Collapse>
        </Card>
      </div>

      <h1>Units</h1>

      <div className={styles.list}>
        {groups.map((group, g) => (
          <>
            <Card key={`group-${group.campus || g}-${group.building || ""}`} interactive className={styles.unitCard}>
              <div className={styles.row}>
                <div>
                  <Label>
                    <h3>Site {`${group.campus || "N/A"} ${group.building || "N/A"}`}</h3>
                  </Label>
                </div>
                <div className={styles.actions}>
                  <Tooltip content="View in Grafana" position={Position.TOP}>
                    <AnchorButton
                      icon={IconNames.DASHBOARD}
                      intent={Intent.PRIMARY}
                      variant={ButtonVariant.MINIMAL}
                      target="_blank"
                      href={`/grafana/${group.campus?.toLocaleLowerCase()}/${group.building?.toLocaleLowerCase()}/site`}
                    />
                  </Tooltip>
                </div>
              </div>
            </Card>
            {units
              .filter((unit) => (unit.campus || "N/A") === group.campus && (unit.building || "N/A") === group.building)
              .map((unit, i) => {
                const isEditing = unit.id === editing?.id;
                const { campus, building, system, timezone } = merge(
                  {},
                  pick(unit, ["campus", "building", "system", "timezone"]),
                  pick(editing, ["campus", "building", "system", "timezone"]),
                );
                const label = editing?.configuration?.label ?? unit.configuration?.label ?? "";

                return (
                  <Card key={`unit-${unit.id ?? i}`} interactive className={styles.unitCard}>
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
                            <Tooltip
                              content={hasAnyOperations() ? "Saving..." : "Save"}
                              position={Position.TOP}
                              disabled={!editing || hasAnyOperations()}
                            >
                              <Button
                                icon={hasAnyOperations() ? IconNames.REFRESH : IconNames.FLOPPY_DISK}
                                intent={Intent.PRIMARY}
                                variant={ButtonVariant.MINIMAL}
                                onClick={handleSave}
                                disabled={!editing || hasAnyOperations()}
                                loading={hasAnyOperations()}
                              />
                            </Tooltip>
                            <Tooltip content="Cancel" position={Position.TOP}>
                              <Button
                                icon={IconNames.CROSS}
                                intent={Intent.PRIMARY}
                                minimal
                                onClick={() => setEditing(null)}
                                disabled={hasAnyOperations()}
                              />
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            <Tooltip content="Edit" position={Position.TOP}>
                              <Button
                                icon={IconNames.EDIT}
                                intent={Intent.PRIMARY}
                                minimal
                                onClick={() => setEditing({ id: unit.id })}
                              />
                            </Tooltip>
                          </>
                        )}
                        <Tooltip content="View in Grafana" position={Position.TOP}>
                          <AnchorButton
                            icon={IconNames.DASHBOARD}
                            intent={Intent.PRIMARY}
                            variant={ButtonVariant.MINIMAL}
                            target="_blank"
                            href={`/grafana/${campus?.toLocaleLowerCase()}/${building?.toLocaleLowerCase()}/${system?.toLocaleLowerCase()}`}
                          />
                        </Tooltip>
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
                                value={campus ?? ""}
                                onChange={(e) => {
                                  const clone = cloneDeep(editing ?? {});
                                  clone.campus = e.target.value;
                                  setEditing(clone);
                                }}
                                readOnly
                              />
                            </Label>
                          </div>
                          <div>
                            <Label>
                              <b>Building</b>
                              <InputGroup
                                type="text"
                                value={building ?? ""}
                                onChange={(e) => {
                                  const clone = cloneDeep(editing ?? {});
                                  clone.building = e.target.value;
                                  setEditing(clone);
                                }}
                                readOnly
                              />
                            </Label>
                          </div>
                          <div>
                            <Label>
                              <b>System</b>
                              <InputGroup
                                type="text"
                                value={system ?? ""}
                                onChange={(e) => {
                                  const clone = cloneDeep(editing ?? {});
                                  clone.system = e.target.value;
                                  setEditing(clone);
                                }}
                                readOnly
                              />
                            </Label>
                          </div>
                          <div>
                            <Label>
                              <b>Timezone</b>
                              <InputGroup
                                type="text"
                                value={timezone ?? ""}
                                onChange={(e) => {
                                  const clone = cloneDeep(editing ?? {});
                                  clone.timezone = e.target.value;
                                  setEditing(clone);
                                }}
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
                                  value={label ?? ""}
                                  onChange={(e) => {
                                    const clone = cloneDeep(editing ?? {});
                                    clone.configuration = clone.configuration ?? {};
                                    clone.configuration.label = e.target.value;
                                    setEditing(clone);
                                  }}
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
                              <Setpoint unit={unit} editing={editing} setEditing={setEditing} />
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
                              <Schedules unit={unit} editing={editing} setEditing={setEditing} />
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
                              <Holidays unit={unit} editing={editing} setEditing={setEditing} />
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
                              <Occupancies unit={unit} editing={editing} setEditing={setEditing} />
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
                              <Unit unit={unit} editing={editing} setEditing={setEditing} />
                            </div>
                          </Collapse>
                        </Collapse>
                      </>
                    )}
                  </Card>
                );
              })}
          </>
        ))}
      </div>

      {renderConfirm()}
    </div>
  );
}
