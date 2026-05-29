import {
  InputGroup,
  Intent,
  Label,
  RangeSlider,
  Switch,
  NumberRange,
  MultiSlider,
  HandleType,
  HandleInteractionKind,
} from "@blueprintjs/core";
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
  readOnly?: boolean;
}

function getSchedule(id: string, unit: UnitType | null, editing: DeepPartial<UnitType> | null): ScheduleType {
  return merge(
    {},
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

function setSchedule(id: string, unit: UnitType | null, editing: DeepPartial<UnitType>, schedule: ScheduleType) {
  if (unit?.configuration?.mondaySchedule?.id === id) {
    editing.configuration = editing.configuration ?? {};
    editing.configuration.mondaySchedule = schedule;
  } else if (unit?.configuration?.tuesdaySchedule?.id === id) {
    editing.configuration = editing.configuration ?? {};
    editing.configuration.tuesdaySchedule = schedule;
  } else if (unit?.configuration?.wednesdaySchedule?.id === id) {
    editing.configuration = editing.configuration ?? {};
    editing.configuration.wednesdaySchedule = schedule;
  } else if (unit?.configuration?.thursdaySchedule?.id === id) {
    editing.configuration = editing.configuration ?? {};
    editing.configuration.thursdaySchedule = schedule;
  } else if (unit?.configuration?.fridaySchedule?.id === id) {
    editing.configuration = editing.configuration ?? {};
    editing.configuration.fridaySchedule = schedule;
  } else if (unit?.configuration?.saturdaySchedule?.id === id) {
    editing.configuration = editing.configuration ?? {};
    editing.configuration.saturdaySchedule = schedule;
  } else if (unit?.configuration?.sundaySchedule?.id === id) {
    editing.configuration = editing.configuration ?? {};
    editing.configuration.sundaySchedule = schedule;
  } else if (unit?.configuration?.holidaySchedule?.id === id) {
    editing.configuration = editing.configuration ?? {};
    editing.configuration.holidaySchedule = schedule;
  } else {
    editing.configuration = editing.configuration ?? {};
    editing.configuration.occupancies = editing.configuration?.occupancies ?? [];
    let occupancy = editing?.configuration?.occupancies?.filter(typeofNonNullable).find((v) => v.schedule?.id === id);
    if (!occupancy) {
      const occupancyId = unit?.configuration?.occupancies
        ?.filter(typeofNonNullable)
        .find((v) => v.schedule?.id === id)?.id;
      occupancy = { id: occupancyId, schedule };
      editing.configuration.occupancies.push(occupancy);
    } else {
      occupancy.schedule = schedule;
    }
  }
}

type ScheduleField =
  | "startTime"
  | "endTime"
  | "overridePreStartTime"
  | "overridePreEndTime"
  | "overridePostStartTime"
  | "overridePostEndTime";

export function Schedule({ title, id, unit, editing, setEditing, readOnly = false }: ScheduleProps) {
  const schedule = getSchedule(id, unit, editing);
  const {
    label,
    occupied,
    startTime,
    endTime,
    override,
    overridePreStartTime,
    overridePreEndTime,
    overridePostStartTime,
    overridePostEndTime,
  } = schedule || {};

  const occupiedStart = toMinutes(startTime ?? "", false);
  const occupiedEnd = toMinutes(endTime ?? "", true);
  const preStart = toMinutes(overridePreStartTime ?? "", false);
  const preEnd = toMinutes(overridePreEndTime ?? "", true);
  const postStart = toMinutes(overridePostStartTime ?? "", false);
  const postEnd = toMinutes(overridePostEndTime ?? "", true);

  const writeTime = (field: ScheduleField, minutes: number, updateLabel = false) => {
    const clone = cloneDeep(editing ?? {});
    let value = getSchedule(id, null, clone);
    if (!value?.id) {
      value = { id };
    }
    value[field] = toDataFormat(minutes);
    if (updateLabel) {
      const newStart = field === "startTime" ? minutes : occupiedStart;
      const newEnd = field === "endTime" ? minutes : occupiedEnd;
      value.label = createScheduleLabel("all", {
        occupied: occupied ?? false,
        startTime: newStart,
        endTime: newEnd,
      });
    }
    setSchedule(id, unit, clone, value);
    setEditing?.(clone);
  };

  return (
    <div className="schedule-row">
      <div className="schedule-label">
        <Label>
          <b>{title}</b>
          <InputGroup
            type="text"
            value={label ?? ""}
            onChange={(e) => {
              const clone = cloneDeep(editing ?? {});
              let value = getSchedule(id, null, clone);
              if (!value?.id) {
                value = { id };
              }
              value.label = e.target.value;
              setSchedule(id, unit, clone, value);
              setEditing?.(clone);
            }}
            readOnly={readOnly}
            placeholder="Schedule label"
          />
        </Label>
      </div>

      <div className="schedule-slider">
        {override ? (
          <MultiSlider
            min={START_TIME_MIN}
            max={END_TIME_MAX}
            stepSize={5}
            labelStepSize={240}
            disabled={readOnly}
            labelRenderer={(v, o) =>
              o?.isHandleTooltip || (v > START_TIME_MIN && v < END_TIME_MAX) ? toTimeFormat(v) : ""
            }
          >
            <MultiSlider.Handle
              type={HandleType.START}
              interactionKind={HandleInteractionKind.LOCK}
              intentAfter={Intent.WARNING}
              value={preStart}
              onChange={(v) => writeTime("overridePreStartTime", clamp(v, START_TIME_MIN, preEnd))}
            />
            <MultiSlider.Handle
              type={HandleType.END}
              interactionKind={HandleInteractionKind.LOCK}
              value={preEnd}
              onChange={(v) => writeTime("overridePreEndTime", clamp(v, preStart, occupiedStart))}
            />
            <MultiSlider.Handle
              type={HandleType.START}
              interactionKind={HandleInteractionKind.LOCK}
              intentAfter={Intent.SUCCESS}
              value={occupiedStart}
              onChange={(v) => writeTime("startTime", clamp(v, preEnd, occupiedEnd - TIME_PADDING), true)}
            />
            <MultiSlider.Handle
              type={HandleType.END}
              interactionKind={HandleInteractionKind.LOCK}
              value={occupiedEnd}
              onChange={(v) => writeTime("endTime", clamp(v, occupiedStart + TIME_PADDING, postStart), true)}
            />
            <MultiSlider.Handle
              type={HandleType.START}
              interactionKind={HandleInteractionKind.LOCK}
              intentAfter={Intent.WARNING}
              value={postStart}
              onChange={(v) => writeTime("overridePostStartTime", clamp(v, occupiedEnd, postEnd))}
            />
            <MultiSlider.Handle
              type={HandleType.END}
              interactionKind={HandleInteractionKind.LOCK}
              value={postEnd}
              onChange={(v) => writeTime("overridePostEndTime", clamp(v, postStart, END_TIME_MAX))}
            />
          </MultiSlider>
        ) : (
          <RangeSlider
            min={START_TIME_MIN}
            max={END_TIME_MAX}
            stepSize={5}
            labelStepSize={240}
            intent={Intent.SUCCESS}
            value={occupied ? [occupiedStart, occupiedEnd] : [START_TIME_MIN, START_TIME_MIN]}
            labelRenderer={(v, o) =>
              o?.isHandleTooltip || (v > START_TIME_MIN && v < END_TIME_MAX) ? toTimeFormat(v) : ""
            }
            disabled={readOnly || !occupied}
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
              let value = getSchedule(id, null, clone);
              if (!value?.id) {
                value = { id };
              }
              value.label = label;
              value.startTime = toDataFormat(startTime);
              value.endTime = toDataFormat(endTime);
              setSchedule(id, unit, clone, value);
              setEditing?.(clone);
            }}
          />
        )}
      </div>

      <div className="schedule-switch">
        <Switch
          label="Unoccupied"
          checked={!occupied}
          onChange={() => {
            const label = createScheduleLabel("all", {
              occupied: !occupied,
              startTime: occupiedStart,
              endTime: occupiedEnd,
            });
            const clone = cloneDeep(editing ?? {});
            let value = getSchedule(id, null, clone);
            if (!value?.id) {
              value = { id };
            }
            value.occupied = !occupied;
            value.label = label;
            setSchedule(id, unit, clone, value);
            setEditing?.(clone);
          }}
          disabled={readOnly}
        />
      </div>

      <div className="schedule-override">
        <Switch
          label="Override"
          checked={override ?? false}
          onChange={() => {
            const clone = cloneDeep(editing ?? {});
            let value = getSchedule(id, null, clone);
            if (!value?.id) {
              value = { id };
            }
            value.override = !override;
            setSchedule(id, unit, clone, value);
            setEditing?.(clone);
          }}
          disabled={readOnly}
        />
      </div>
    </div>
  );
}
