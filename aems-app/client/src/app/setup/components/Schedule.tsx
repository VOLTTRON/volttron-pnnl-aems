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
  // Override windows use literal parsing: "00:00" stays 0, "24:00" stays 1440.
  // Using upper=true here would map "00:00" to 1440 and break the slider.
  const preStart = toMinutes(overridePreStartTime ?? "", false);
  const preEnd = toMinutes(overridePreEndTime ?? "", false);
  const postStart = toMinutes(overridePostStartTime ?? "", false);
  const postEnd = toMinutes(overridePostEndTime ?? "", false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
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

      <div style={{ padding: "0 1rem" }}>
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
            onChange={(values) => {
              // values are sorted in handle-order. With occupied=true: [preStart, preEnd, occStart, occEnd, postStart, postEnd].
              // With occupied=false: [preStart, preEnd, postStart, postEnd].
              const [
                nextPreStart,
                nextPreEnd,
                nextOccStart,
                nextOccEnd,
                nextPostStart,
                nextPostEnd,
              ] = occupied
                ? values
                : [values[0], values[1], occupiedStart, occupiedEnd, values[2], values[3]];

              // Clamp atomically against the NEW sibling values, not stale render-time ones.
              const ps = clamp(nextPreStart, START_TIME_MIN, nextPreEnd);
              const pe = clamp(nextPreEnd, ps, occupied ? nextOccStart : nextPostStart);
              const os = occupied
                ? clamp(nextOccStart, pe, nextOccEnd - TIME_PADDING)
                : nextOccStart;
              const oe = occupied
                ? clamp(nextOccEnd, os + TIME_PADDING, nextPostStart)
                : nextOccEnd;
              const qs = clamp(nextPostStart, occupied ? oe : pe, nextPostEnd);
              const qe = clamp(nextPostEnd, qs, END_TIME_MAX);

              const clone = cloneDeep(editing ?? {});
              let value = getSchedule(id, null, clone);
              if (!value?.id) {
                value = { id };
              }
              if (ps !== preStart) value.overridePreStartTime = toDataFormat(ps);
              if (pe !== preEnd) value.overridePreEndTime = toDataFormat(pe);
              if (occupied && os !== occupiedStart) value.startTime = toDataFormat(os);
              if (occupied && oe !== occupiedEnd) value.endTime = toDataFormat(oe);
              if (qs !== postStart) value.overridePostStartTime = toDataFormat(qs);
              if (qe !== postEnd) value.overridePostEndTime = toDataFormat(qe);
              if (occupied && (os !== occupiedStart || oe !== occupiedEnd)) {
                value.label = createScheduleLabel("all", {
                  occupied: occupied ?? false,
                  startTime: os,
                  endTime: oe,
                });
              }
              setSchedule(id, unit, clone, value);
              setEditing?.(clone);
            }}
          >
            <MultiSlider.Handle
              type={HandleType.START}
              interactionKind={HandleInteractionKind.PUSH}
              intentAfter={Intent.WARNING}
              value={preStart}
            />
            <MultiSlider.Handle
              type={HandleType.END}
              interactionKind={HandleInteractionKind.PUSH}
              value={preEnd}
            />
            {occupied && (
              <MultiSlider.Handle
                type={HandleType.START}
                interactionKind={HandleInteractionKind.PUSH}
                intentAfter={Intent.SUCCESS}
                value={occupiedStart}
              />
            )}
            {occupied && (
              <MultiSlider.Handle
                type={HandleType.END}
                interactionKind={HandleInteractionKind.PUSH}
                value={occupiedEnd}
              />
            )}
            <MultiSlider.Handle
              type={HandleType.START}
              interactionKind={HandleInteractionKind.PUSH}
              intentAfter={Intent.WARNING}
              value={postStart}
            />
            <MultiSlider.Handle
              type={HandleType.END}
              interactionKind={HandleInteractionKind.PUSH}
              value={postEnd}
            />
          </MultiSlider>
        ) : occupied ? (
          <RangeSlider
            min={START_TIME_MIN}
            max={END_TIME_MAX}
            stepSize={5}
            labelStepSize={240}
            intent={Intent.SUCCESS}
            value={[occupiedStart, occupiedEnd]}
            labelRenderer={(v, o) =>
              o?.isHandleTooltip || (v > START_TIME_MIN && v < END_TIME_MAX) ? toTimeFormat(v) : ""
            }
            disabled={readOnly}
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
        ) : (
          <div
            style={{
              height: "6px",
              borderRadius: "3px",
              backgroundColor: "var(--bp5-text-color-muted)",
              opacity: 0.3,
              margin: "1.5rem 0",
            }}
          />
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "row", gap: "1rem", alignItems: "center" }}>
        <Switch
          label="Unoccupied"
          checked={!occupied}
          onChange={() => {
            const nextOccupied = !occupied;
            const label = createScheduleLabel("all", {
              occupied: nextOccupied,
              startTime: occupiedStart,
              endTime: occupiedEnd,
            });
            const clone = cloneDeep(editing ?? {});
            let value = getSchedule(id, null, clone);
            if (!value?.id) {
              value = { id };
            }
            value.occupied = nextOccupied;
            value.label = label;
            // Re-enabling occupied: snap any override handles that crossed the
            // occupied range while it was hidden so the resulting MultiSlider
            // is in a valid (non-inverted) state.
            if (nextOccupied && override) {
              const newPreEnd = clamp(preEnd, START_TIME_MIN, occupiedStart);
              const newPreStart = clamp(preStart, START_TIME_MIN, newPreEnd);
              const newPostStart = clamp(postStart, occupiedEnd, END_TIME_MAX);
              const newPostEnd = clamp(postEnd, newPostStart, END_TIME_MAX);
              if (newPreEnd !== preEnd) value.overridePreEndTime = toDataFormat(newPreEnd);
              if (newPreStart !== preStart) value.overridePreStartTime = toDataFormat(newPreStart);
              if (newPostStart !== postStart) value.overridePostStartTime = toDataFormat(newPostStart);
              if (newPostEnd !== postEnd) value.overridePostEndTime = toDataFormat(newPostEnd);
            }
            setSchedule(id, unit, clone, value);
            setEditing?.(clone);
          }}
          disabled={readOnly}
        />
        <Switch
          label="Service Schedule"
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
