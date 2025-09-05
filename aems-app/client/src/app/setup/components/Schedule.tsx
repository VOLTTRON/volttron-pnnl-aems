import { 
  InputGroup, 
  Intent, 
  Label, 
  RangeSlider,
  Switch,
  NumberRange
} from "@blueprintjs/core";
import { useCallback } from "react";
import { get, clamp } from "lodash";
import {
  START_TIME_MIN,
  END_TIME_MAX,
  TIME_PADDING,
  toDataFormat,
  toTimeFormat,
  toMinutes,
  createScheduleLabel
} from "@/utils/schedule";
import { Unit } from "@/graphql-codegen/graphql";
import { DeepPartial } from "@local/common";

type UnitType = Unit;

interface ScheduleProps {
  title: string;
  path: string;
  unit: UnitType | null;
  editing: DeepPartial<UnitType> | null;
  handleChange: (field: string, editingUnit?: DeepPartial<UnitType> | null) => (value: string | number | boolean | object | null | undefined) => void;
  readOnly?: Array<"title" | "occupied" | "unoccupied">;
}

export function Schedule({ 
  title, 
  path, 
  unit, 
  editing, 
  handleChange, 
  readOnly = ["title"] 
}: ScheduleProps) {
  const getValue = useCallback((field: string) => {
    return get(editing, field, get(unit, field));
  }, [editing, unit]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 120px', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
      <div>
        <Label>
          <b>{title}</b>
          <InputGroup
            type="text"
            value={getValue(`${path}.label`) || ""}
            onChange={(e) => {
              handleChange(`${path}.label`, editing)(e.target.value);
            }}
            readOnly={readOnly?.includes("title")}
            placeholder="Schedule label"
          />
        </Label>
      </div>
      
      <div style={{ padding: '0 1rem' }}>
        <RangeSlider
          min={START_TIME_MIN}
          max={END_TIME_MAX}
          stepSize={5}
          labelStepSize={240}
          intent={Intent.SUCCESS}
          value={
            getValue(`${path}.occupied`)
              ? [toMinutes(getValue(`${path}.startTime`), false), toMinutes(getValue(`${path}.endTime`), true)]
              : [START_TIME_MIN, START_TIME_MIN]
          }
          labelRenderer={(v, o) =>
            o?.isHandleTooltip || (v > START_TIME_MIN && v < END_TIME_MAX) ? toTimeFormat(v) : ""
          }
          disabled={readOnly?.includes("occupied") || !getValue(`${path}.occupied`)}
          onChange={(v) => {
            const occupied = getValue(`${path}.occupied`);
            const startTime = clamp(
              (v as NumberRange)[0],
              START_TIME_MIN,
              Math.min((v as NumberRange)[1], END_TIME_MAX) - TIME_PADDING
            );
            const endTime = clamp(
              (v as NumberRange)[1],
              Math.max((v as NumberRange)[0], START_TIME_MIN) + TIME_PADDING,
              END_TIME_MAX
            );
            const label = createScheduleLabel("all", { occupied, startTime, endTime });
            handleChange(
              `${path}`,
              editing
            )({ startTime: toDataFormat(startTime), endTime: toDataFormat(endTime), label });
          }}
        />
      </div>
      
      <div>
        <Switch
          label="Unoccupied"
          checked={!getValue(`${path}.occupied`)}
          onChange={() => {
            const occupied = !getValue(`${path}.occupied`);
            const startTime = toMinutes(getValue(`${path}.startTime`), false);
            const endTime = toMinutes(getValue(`${path}.endTime`), true);
            const label = createScheduleLabel("all", { occupied, startTime, endTime });
            handleChange(`${path}`, editing)({ occupied, label });
          }}
          disabled={readOnly?.includes("unoccupied")}
        />
      </div>
    </div>
  );
}
