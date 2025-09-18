import { InputGroup, Intent, Label, RangeSlider, Switch, NumberRange } from "@blueprintjs/core";
import { clamp, cloneDeep, merge } from "lodash";
import {
  START_TIME_MIN,
  END_TIME_MAX,
  TIME_PADDING,
  toDataFormat,
  toTimeFormat,
  toMinutes,
  createScheduleLabel,
} from "@/utils/schedule";
import { ReadUnitQuery } from "@/graphql-codegen/graphql";
import { DeepPartial, typeofNonNullable } from "@local/common";

type UnitType = NonNullable<ReadUnitQuery["readUnit"]>;
type ScheduleType = NonNullable<NonNullable<UnitType["configuration"]>["mondaySchedule"]>;

interface ScheduleProps {
  title: string;
  id: string;
  unit: UnitType | null;
  editing: DeepPartial<UnitType> | null;
  setEditing?: (editing: DeepPartial<UnitType> | null) => void;
  readOnly?: Array<"title" | "occupied" | "unoccupied">;
}

function getSchedule(id: string, unit: UnitType | null, editing: DeepPartial<UnitType> | null): ScheduleType {
  return merge(
    { label: "", occupied: true, startTime: "08:00", endTime: "17:00" },
    unit?.configuration?.occupancies?.filter(typeofNonNullable).find((v) => v.schedule?.id === id)?.schedule ??
      (unit?.configuration?.mondaySchedule?.id === id ? unit?.configuration?.mondaySchedule : undefined) ??
      (unit?.configuration?.tuesdaySchedule?.id === id ? unit?.configuration?.tuesdaySchedule : undefined) ??
      (unit?.configuration?.wednesdaySchedule?.id === id ? unit?.configuration?.wednesdaySchedule : undefined) ??
      (unit?.configuration?.thursdaySchedule?.id === id ? unit?.configuration?.thursdaySchedule : undefined) ??
      (unit?.configuration?.fridaySchedule?.id === id ? unit?.configuration?.fridaySchedule : undefined) ??
      (unit?.configuration?.saturdaySchedule?.id === id ? unit?.configuration?.saturdaySchedule : undefined) ??
      (unit?.configuration?.sundaySchedule?.id === id ? unit?.configuration?.sundaySchedule : undefined) ??
      (unit?.configuration?.holidaySchedule?.id === id ? unit?.configuration?.holidaySchedule : undefined),
    editing?.configuration?.occupancies?.filter(typeofNonNullable).find((v) => v.schedule?.id === id)?.schedule ??
      (editing?.configuration?.mondaySchedule?.id === id ? editing?.configuration?.mondaySchedule : undefined) ??
      (editing?.configuration?.tuesdaySchedule?.id === id ? editing?.configuration?.tuesdaySchedule : undefined) ??
      (editing?.configuration?.wednesdaySchedule?.id === id ? editing?.configuration?.wednesdaySchedule : undefined) ??
      (editing?.configuration?.thursdaySchedule?.id === id ? editing?.configuration?.thursdaySchedule : undefined) ??
      (editing?.configuration?.fridaySchedule?.id === id ? editing?.configuration?.fridaySchedule : undefined) ??
      (editing?.configuration?.saturdaySchedule?.id === id ? editing?.configuration?.saturdaySchedule : undefined) ??
      (editing?.configuration?.sundaySchedule?.id === id ? editing?.configuration?.sundaySchedule : undefined) ??
      (editing?.configuration?.holidaySchedule?.id === id ? editing?.configuration?.holidaySchedule : undefined),
  );
}

function setSchedule(id: string, unit: UnitType | null, editing: DeepPartial<UnitType> | null, schedule: ScheduleType) {
  if (unit?.configuration?.mondaySchedule?.id === id) {
    editing = editing ?? {};
    editing.configuration = editing.configuration ?? {};
    editing.configuration.mondaySchedule = editing.configuration?.mondaySchedule ?? {};
    merge(editing?.configuration?.mondaySchedule, schedule);
  } else if (unit?.configuration?.tuesdaySchedule?.id === id) {
    editing = editing ?? {};
    editing.configuration = editing.configuration ?? {};
    editing.configuration.tuesdaySchedule = editing.configuration?.tuesdaySchedule ?? {};
    merge(editing?.configuration?.tuesdaySchedule, schedule);
  } else if (unit?.configuration?.wednesdaySchedule?.id === id) {
    editing = editing ?? {};
    editing.configuration = editing.configuration ?? {};
    editing.configuration.wednesdaySchedule = editing.configuration?.wednesdaySchedule ?? {};
    merge(editing?.configuration?.wednesdaySchedule, schedule);
  } else if (unit?.configuration?.thursdaySchedule?.id === id) {
    editing = editing ?? {};
    editing.configuration = editing.configuration ?? {};
    editing.configuration.thursdaySchedule = editing.configuration?.thursdaySchedule ?? {};
    merge(editing?.configuration?.thursdaySchedule, schedule);
  } else if (unit?.configuration?.fridaySchedule?.id === id) {
    editing = editing ?? {};
    editing.configuration = editing.configuration ?? {};
    editing.configuration.fridaySchedule = editing.configuration?.fridaySchedule ?? {};
    merge(editing?.configuration?.fridaySchedule, schedule);
  } else if (unit?.configuration?.saturdaySchedule?.id === id) {
    editing = editing ?? {};
    editing.configuration = editing.configuration ?? {};
    editing.configuration.saturdaySchedule = editing.configuration?.saturdaySchedule ?? {};
    merge(editing?.configuration?.saturdaySchedule, schedule);
  } else if (unit?.configuration?.sundaySchedule?.id === id) {
    editing = editing ?? {};
    editing.configuration = editing.configuration ?? {};
    editing.configuration.sundaySchedule = editing.configuration?.sundaySchedule ?? {};
    merge(editing?.configuration?.sundaySchedule, schedule);
  } else if (unit?.configuration?.holidaySchedule?.id === id) {
    editing = editing ?? {};
    editing.configuration = editing.configuration ?? {};
    editing.configuration.holidaySchedule = editing.configuration?.holidaySchedule ?? {};
    merge(editing?.configuration?.holidaySchedule, schedule);
  } else {
    editing = editing ?? {};
    editing.configuration = editing.configuration ?? {};
    editing.configuration.occupancies = editing.configuration?.occupancies ?? [];
    let value = editing?.configuration?.occupancies
      ?.filter(typeofNonNullable)
      .find((v) => v.schedule?.id === id)?.schedule;
    if (!value) {
      value = { id };
      editing.configuration.occupancies.push({ schedule: value });
    }
    merge(value, schedule);
  }
}

export function Schedule({ title, id, unit, editing, setEditing, readOnly = ["title"] }: ScheduleProps) {
  const schedule = getSchedule(id, unit, editing);
  const { label, occupied, startTime, endTime } = schedule || {};

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr 120px",
        gap: "1rem",
        alignItems: "center",
        marginBottom: "1rem",
      }}
    >
      <div>
        <Label>
          <b>{title}</b>
          <InputGroup
            type="text"
            value={label ?? ""}
            onChange={(e) => {
              const clone = cloneDeep(editing ?? {});
              clone.configuration = clone.configuration ?? {};
              clone.configuration.occupancies = clone.configuration?.occupancies ?? [];
              let value = getSchedule(id, null, clone);
              if (!value) {
                value = { id };
              }
              value.label = e.target.value;
              setSchedule(id, unit, clone, value);
              setEditing?.(clone);
            }}
            readOnly={readOnly?.includes("title")}
            placeholder="Schedule label"
          />
        </Label>
      </div>

      <div style={{ padding: "0 1rem" }}>
        <RangeSlider
          min={START_TIME_MIN}
          max={END_TIME_MAX}
          stepSize={5}
          labelStepSize={240}
          intent={Intent.SUCCESS}
          value={
            occupied
              ? [toMinutes(startTime ?? "", false), toMinutes(endTime ?? "", true)]
              : [START_TIME_MIN, START_TIME_MIN]
          }
          labelRenderer={(v, o) =>
            o?.isHandleTooltip || (v > START_TIME_MIN && v < END_TIME_MAX) ? toTimeFormat(v) : ""
          }
          disabled={readOnly?.includes("occupied") || !occupied}
          onChange={(v) => {
            const startTime = clamp(
              (v as NumberRange)[0],
              START_TIME_MIN,
              Math.min((v as NumberRange)[1], END_TIME_MAX) - TIME_PADDING,
            );
            const endTime = clamp(
              (v as NumberRange)[1],
              Math.max((v as NumberRange)[0], START_TIME_MIN) + TIME_PADDING,
              END_TIME_MAX,
            );
            const label = createScheduleLabel("all", { occupied: occupied ?? false, startTime, endTime });
            const clone = cloneDeep(editing ?? {});
            clone.configuration = clone.configuration ?? {};
            clone.configuration.occupancies = clone.configuration?.occupancies ?? [];
            let value = getSchedule(id, null, clone);
            if (!value) {
              value = { id };
            }
            value.label = label;
            value.startTime = toDataFormat(startTime);
            value.endTime = toDataFormat(endTime);
            setSchedule(id, unit, clone, value);
            setEditing?.(clone);
          }}
        />
      </div>

      <div>
        <Switch
          label="Unoccupied"
          checked={!occupied}
          onChange={() => {
            const value = !occupied;
            const st = toMinutes(startTime ?? "", false);
            const et = toMinutes(endTime ?? "", true);
            const label = createScheduleLabel("all", { occupied: value, startTime: st, endTime: et });
            const clone = cloneDeep(editing ?? {});
            clone.configuration = clone.configuration ?? {};
            clone.configuration.occupancies = clone.configuration?.occupancies ?? [];
            let v = getSchedule(id, null, clone);
            if (!v) {
              v = { id };
            }
            v.occupied = value;
            v.label = label;
            setSchedule(id, unit, clone, v);
            setEditing?.(clone);
          }}
          disabled={readOnly?.includes("unoccupied")}
        />
      </div>
    </div>
  );
}
