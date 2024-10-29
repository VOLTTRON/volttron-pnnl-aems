import { Checkbox, InputGroup, Intent, Label, NumberRange, RangeSlider } from "@blueprintjs/core";
import {
  END_TIME_MAX,
  START_TIME_MIN,
  TIME_PADDING,
  createScheduleLabel,
  toDataFormat,
  toMinutes,
  toTimeFormat,
} from "utils/schedule";
import { clamp, get } from "lodash";

import { IUnit } from "controllers/units/action";
import { useCallback } from "react";
import { DeepPartial } from "../../utils/types";

export function Schedule(props: {
  title: string;
  path: string;
  unit: IUnit;
  editing: DeepPartial<IUnit> | null;
  handleChange: (field: string, unit?: DeepPartial<IUnit> | null) => (value: any) => void;
  readOnly?: Array<"title" | "occupied" | "unoccupied">;
}) {
  const { title, path, unit, editing, handleChange, readOnly = ["title"] } = props;

  const getValue = useCallback((field: string) => get(editing, field, get(unit, field)), [editing, unit]);

  return (
    <div className="row">
      <h3> </h3>
      <div className="label">
        <Label>
          <b>{title}</b>
          <InputGroup
            type="text"
            value={getValue(`${path}.label`)}
            onChange={(e) => {
              handleChange(`${path}.label`, editing)(e.target.value);
            }}
            readOnly={readOnly?.includes("title")}
          />
        </Label>
      </div>
      <div className="schedule">
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
          disabled={readOnly?.includes("occupied") || !get(editing, `${path}.occupied`, get(unit, `${path}.occupied`))}
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
      <div className="unoccupied">
        <Checkbox
          label="Unoccupied"
          checked={!getValue(`${path}.occupied`)}
          onClick={() => {
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
