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
import { useContext, useMemo, useState, useCallback, useEffect } from "react";
import { useSubscription, useMutation, useQuery } from "@apollo/client";
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
  SubscribeUnitsSubscription,
} from "@/graphql-codegen/graphql";
import { CurrentContext, NotificationContext, NotificationType, RouteContext } from "../components/providers";
import { filter } from "@/utils/client";
import { Search } from "../components/common";
import { IconNames } from "@blueprintjs/icons";
import { cloneDeep, isObject, merge, omit, pick, set } from "lodash";
import { Setpoint } from "./components/Setpoint";
import { Schedules } from "./components/Schedules";
import { Holidays } from "./components/Holidays";
import { Occupancies, OccupancyCreateDelete } from "./components/Occupancies";
import { Unit } from "./components/Unit";
import { Role, HolidayType, DeepPartial, typeofNonNullable, typeofObject } from "@local/common";
import { HolidayCreateDelete } from "./components/Holiday";

type UnitModel = NonNullable<ReadUnitsQuery["readUnits"]>[number];

// Utility function to get common values across units (simplified)
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
  const [editing, setEditing] = useState<DeepPartial<UnitModel> | null>(null);
  const [editingAll, setEditingAll] = useState<DeepPartial<UnitModel> | null>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<(() => void) | null>(null);
  const [saving, setSaving] = useState<string[]>([]);

  const { route } = useContext(RouteContext);
  const { createNotification } = useContext(NotificationContext);
  const { current } = useContext(CurrentContext);

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

  const [updateUnit] = useMutation(UpdateUnitDocument, {
    onCompleted(data) {
      setSaving(saving.filter((v) => v !== `updateUnit(${data.updateUnit?.id})` && v !== "updateUnit"));
    },
    onError(error, options) {
      setSaving(saving.filter((v) => v !== `updateUnit(${options?.variables?.where?.id})` && v !== "updateUnit"));
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const [createHoliday] = useMutation(CreateHolidayDocument, {
    onCompleted() {
      setSaving(saving.filter((v) => v !== "createHoliday"));
    },
    onError(error) {
      console.error(error);
      setSaving(saving.filter((v) => v !== "createHoliday"));
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const [updateHoliday] = useMutation(UpdateHolidayDocument, {
    onCompleted(data) {
      setSaving(saving.filter((v) => v !== `updateHoliday(${data.updateHoliday?.id})` && v !== "updateHoliday"));
    },
    onError(error, options) {
      setSaving(saving.filter((v) => v !== `updateHoliday(${options?.variables?.where?.id})` && v !== "updateHoliday"));
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const [deleteHoliday] = useMutation(DeleteHolidayDocument, {
    onCompleted(data) {
      setSaving(saving.filter((v) => v !== `deleteHoliday(${data.deleteHoliday?.id})` && v !== "deleteHoliday"));
    },
    onError(error, options) {
      setSaving(saving.filter((v) => v !== `deleteHoliday(${options?.variables?.where?.id})` && v !== "deleteHoliday"));
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const [createOccupancy] = useMutation(CreateOccupancyDocument, {
    onCompleted() {
      setSaving(saving.filter((v) => v !== "createOccupancy"));
    },
    onError(error) {
      setSaving(saving.filter((v) => v !== "createOccupancy"));
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const [updateOccupancy] = useMutation(UpdateOccupancyDocument, {
    onCompleted(data) {
      setSaving(saving.filter((v) => v !== `updateOccupancy(${data.updateOccupancy?.id})` && v !== "updateOccupancy"));
    },
    onError(error, options) {
      setSaving(
        saving.filter((v) => v !== `updateOccupancy(${options?.variables?.where?.id})` && v !== "updateOccupancy"),
      );
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const [deleteOccupancy] = useMutation(DeleteOccupancyDocument, {
    onCompleted(data) {
      setSaving(saving.filter((v) => v !== `deleteOccupancy(${data.deleteOccupancy?.id})` && v !== "deleteOccupancy"));
    },
    onError(error, options) {
      setSaving(
        saving.filter((v) => v !== `deleteOccupancy(${options?.variables?.where?.id})` && v !== "deleteOccupancy"),
      );
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const [createLocation] = useMutation(CreateLocationDocument, {
    onCompleted(data) {
      setSaving(saving.filter((v) => v !== "createLocation"));
    },
    onError(error) {
      setSaving(saving.filter((v) => v !== "createLocation"));
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const [updateLocation] = useMutation(UpdateLocationDocument, {
    onCompleted(data) {
      setSaving(saving.filter((v) => v !== `updateLocation(${data.updateLocation?.id})` && v !== "updateLocation"));
    },
    onError(error, options) {
      setSaving(
        saving.filter((v) => v !== `updateLocation(${options?.variables?.where?.id})` && v !== "updateLocation"),
      );
      createNotification?.(error.message, NotificationType.Error);
    },
  });

  const [deleteLocation] = useMutation(DeleteLocationDocument, {
    onCompleted(data) {
      setSaving(saving.filter((v) => v !== `deleteLocation(${data.deleteLocation?.id})` && v !== "deleteLocation"));
    },
    onError(error, options) {
      setSaving(
        saving.filter((v) => v !== `deleteLocation(${options?.variables?.where?.id})` && v !== "deleteLocation"),
      );
      createNotification?.(error.message, NotificationType.Error);
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

  const handleUpdateUnit = useCallback(
    (
      data: SubscribeUnitsSubscription | ReadUnitsQuery | undefined,
      updated: DeepPartial<UnitModel>,
      saving: string[],
    ) => {
      const unit = data?.readUnits?.find((u) => u.id === updated.id) ?? null;
      if (!unit) {
        createNotification?.("Unit not found", NotificationType.Error);
        return;
      } else if (updated.configuration) {
        updated.configuration.id = updated.configuration.id ?? unit.configuration?.id;
      }
      saving = [...saving, `updateUnit(${updated.id})`];
      setSaving(saving);
      try {
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
        });
      } catch (error) {
        saving = saving.filter((v) => v !== `updateUnit(${updated.id})` && v !== "updateUnit");
        setSaving(saving);
        createNotification?.((error as Error).message, NotificationType.Error);
      }
      const location = updated?.location;
      if (location) {
        if (unit.location?.id) {
          saving = [...saving, `deleteLocation(${unit.location?.id})`];
          setSaving(saving);
          try {
            deleteLocation({
              variables: { where: { id: unit.location?.id } },
            });
          } catch (error) {
            saving = saving.filter((v) => v !== `deleteLocation(${unit.location?.id})` && v !== "deleteLocation");
            setSaving(saving);
            createNotification?.((error as Error).message, NotificationType.Error);
          }
        }
        saving = [...saving, `createLocation`];
        setSaving(saving);
        try {
          createLocation({
            variables: {
              create: {
                name: location.name ?? "",
                latitude: location.latitude ?? 0,
                longitude: location.longitude ?? 0,
                units: { connect: [{ id: updated.id ?? "" }] },
              },
            },
          });
        } catch (error) {
          saving = saving.filter((v) => v !== "createLocation");
          setSaving(saving);
          createNotification?.((error as Error).message, NotificationType.Error);
        }
      }
      updated.configuration?.holidays?.filter(typeofNonNullable).forEach((holiday) => {
        const action = typeofObject<HolidayCreateDelete>(holiday, (v) => v.action) ? holiday.action : "update";
        switch (action) {
          case "create":
            saving = [...saving, `createHoliday`];
            setSaving(saving);
            try {
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
              });
            } catch (error) {
              saving = saving.filter((v) => v !== "createHoliday");
              setSaving(saving);
              createNotification?.((error as Error).message, NotificationType.Error);
            }
            break;
          case "update":
            saving = [...saving, `updateHoliday(${holiday.id})`];
            setSaving(saving);
            try {
              updateHoliday({
                variables: { update: omit(holiday, ["id", "action"]), where: { id: holiday.id } },
              });
            } catch (error) {
              saving = saving.filter((v) => v !== `updateHoliday(${holiday.id})` && v !== "updateHoliday");
              setSaving(saving);
              createNotification?.((error as Error).message, NotificationType.Error);
            }
            break;
          case "delete":
            saving = [...saving, `deleteHoliday(${holiday.id})`];
            setSaving(saving);
            try {
              deleteHoliday({
                variables: { where: { id: holiday.id ?? "" } },
              });
            } catch (error) {
              saving = saving.filter((v) => v !== `deleteHoliday(${holiday.id})` && v !== "deleteHoliday");
              setSaving(saving);
              createNotification?.((error as Error).message, NotificationType.Error);
            }
            break;
          default:
            createNotification?.(`Unknown holiday action: ${action}`, NotificationType.Error);
        }
      });
      updated.configuration?.occupancies?.filter(typeofNonNullable).forEach((occupancy) => {
        const action = typeofObject<OccupancyCreateDelete>(occupancy, (v) => v.action) ? occupancy.action : "update";
        switch (action) {
          case "create":
            saving = [...saving, `createOccupancy(${occupancy.id})`];
            setSaving(saving);
            try {
              createOccupancy({
                variables: {
                  create: {
                    label: occupancy.label ?? "",
                    date: occupancy.date ?? new Date().toISOString(),
                    schedule: {
                      create: {
                        label: occupancy.schedule?.label ?? "",
                        endTime: occupancy.schedule?.endTime ?? "00:00",
                        startTime: occupancy.schedule?.startTime ?? "00:00",
                        occupied: occupancy.schedule?.occupied ?? false,
                      },
                    },
                  },
                },
              });
            } catch (error) {
              saving = saving.filter((v) => v !== `createOccupancy(${occupancy.id})` && v !== "createOccupancy");
              setSaving(saving);
              createNotification?.((error as Error).message, NotificationType.Error);
            }
            break;
          case "update":
            saving = [...saving, `updateOccupancy(${occupancy.id})`];
            setSaving(saving);
            try {
              updateOccupancy({
                variables: {
                  update: { ...omit(occupancy, ["action", "schedule"]), schedule: { update: occupancy.schedule } },
                  where: { id: occupancy.id },
                },
              });
            } catch (error) {
              saving = saving.filter((v) => v !== `updateOccupancy(${occupancy.id})` && v !== "updateOccupancy");
              setSaving(saving);
              createNotification?.((error as Error).message, NotificationType.Error);
            }
            break;
          case "delete":
            saving = [...saving, `deleteOccupancy(${occupancy.id})`];
            try {
              deleteOccupancy({
                variables: { where: { id: occupancy.id ?? "" } },
              });
            } catch (error) {
              saving = saving.filter((v) => v !== `deleteOccupancy(${occupancy.id})` && v !== "deleteOccupancy");
              setSaving(saving);
              createNotification?.((error as Error).message, NotificationType.Error);
            }
            break;
          default:
            createNotification?.(`Unknown occupancy action: ${action}`, NotificationType.Error);
        }
      });
    },
    [
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

  const handleSave = () => {
    if (editing?.id) {
      handleUpdateUnit(data, editing, saving);
      const checkSaving = () =>
        setTimeout(() => {
          if (saving.length === 0) {
            createNotification?.("All changes saved successfully", NotificationType.Notification);
          } else {
            checkSaving();
          }
        }, 1000);
      checkSaving();
      setEditing(null);
    }
  };

  const handleSaveAll = () => {
    if (editingAll) {
      units.forEach((unit) => {
        handleUpdateUnit(data, unit, saving);
      });
      const checkSaving = () =>
        setTimeout(() => {
          if (saving.length === 0) {
            createNotification?.("All changes saved successfully", NotificationType.Notification);
          } else {
            checkSaving();
          }
        }, 1000);
      checkSaving();
      setEditingAll(null);
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
        setSaving([...saving, `updateUnit(${unit.id})`]);
        updateUnit({ variables: { update: { stage: ModelStage.Update }, where: { id: unit.id } } });
      };

      return (
        <Tooltip content={message} position={Position.TOP}>
          <Button icon={icon} intent={intent} minimal onClick={handlePush} disabled={!isPush || saving.length > 0} />
        </Tooltip>
      );
    },
    [updateUnit, editing, saving],
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
                {editingAll ? (
                  <>
                    <Tooltip content="Save All" position={Position.TOP}>
                      <Button
                        icon={saving.length > 0 ? IconNames.REFRESH : IconNames.FLOPPY_DISK}
                        intent={Intent.PRIMARY}
                        minimal
                        onClick={handleSaveAll}
                        disabled={saving.length > 0}
                        loading={saving.length > 0}
                      />
                    </Tooltip>
                    <Tooltip content="Clear All" position={Position.TOP}>
                      <Button
                        icon={IconNames.CROSS}
                        intent={Intent.PRIMARY}
                        minimal
                        onClick={() => setEditingAll(null)}
                        disabled={saving.length > 0}
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
                    unit={defaultUnit}
                    editing={editingAll}
                    setEditing={setEditingAll}
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
                  <Unit unit={defaultUnit} editing={editingAll} setEditing={setEditing} />
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
          const { campus, building, system, timezone } = merge(
            {},
            pick(unit, ["campus", "building", "system", "timezone"]),
            pick(editing, ["campus", "building", "system", "timezone"]),
          );
          const label = editing?.configuration?.label ?? unit.configuration?.label ?? "";

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
                      <Tooltip
                        content={saving.length > 0 ? "Saving..." : "Save"}
                        position={Position.TOP}
                        disabled={!editing || saving.length > 0}
                      >
                        <Button
                          icon={saving.length > 0 ? IconNames.REFRESH : IconNames.FLOPPY_DISK}
                          intent={Intent.PRIMARY}
                          minimal
                          onClick={handleSave}
                          disabled={!editing || saving.length > 0}
                          loading={saving.length > 0}
                        />
                      </Tooltip>
                      <Tooltip content="Cancel" position={Position.TOP}>
                        <Button
                          icon={IconNames.CROSS}
                          intent={Intent.PRIMARY}
                          minimal
                          onClick={() => setEditing(null)}
                          disabled={saving.length > 0}
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
      </div>

      {renderConfirm()}
    </div>
  );
}
