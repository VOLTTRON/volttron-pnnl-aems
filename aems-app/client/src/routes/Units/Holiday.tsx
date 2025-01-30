import { Button, Checkbox, InputGroup, Intent, Label } from "@blueprintjs/core";

import { IHoliday } from "controllers/holidays/action";
import { IUnit } from "controllers/units/action";
import { IconNames } from "@blueprintjs/icons";
import { ObservanceType } from "common";
import { get } from "lodash";
import moment from "moment";
import { useCallback } from "react";
import { DeepPartial } from "../../utils/types";

export function Holiday(props: {
  path: string;
  unit: DeepPartial<IUnit> | IUnit;
  editing: DeepPartial<IUnit> | null;
  holiday: DeepPartial<IHoliday>;
  handleChange: (field: string, unit?: DeepPartial<IUnit> | null) => (value: any) => void;
  readOnly?: boolean;
}) {
  const { path, unit, editing, holiday, handleChange, readOnly } = props;
  const { id, label, type, month, day, observance } = holiday;

  const getValue = useCallback((field: string) => get(editing, field, get(unit, field)), [editing, unit]);

  switch (type) {
    case "Custom":
      const suffix = observance && ObservanceType.parse(observance)?.label;
      const desc = `${moment()
        .set("month", (month as number) - 1)
        .set("date", day as number)
        .format("MMMM Do")} ${suffix && `(${suffix})`}`;

      return (
        <>
          <div className="row">
            <div>
              <Label>
                <b>{label}</b>
                <InputGroup type="text" value={desc} readOnly />
              </Label>
            </div>
            <div>
              <Button
                icon={IconNames.TRASH}
                intent={Intent.WARNING}
                minimal
                onClick={() => {
                  handleChange(path, editing)({ id: id, type: type, action: "delete" });
                }}
                disabled={readOnly}
              />
            </div>
          </div>
        </>
      );
    case "Enabled":
    case "Disabled":
    default:
      return (
        <div className="row">
          <div className="holiday">
            <Label>
              <b>{label}</b>
              <Checkbox
                label="Enabled"
                checked={getValue(`${path}.type`) === "Enabled"}
                onClick={() => {
                  handleChange(
                    `${path}`,
                    editing
                  )({
                    id: getValue(`${path}.id`),
                    type: getValue(`${path}.type`) === "Enabled" ? "Disabled" : "Enabled",
                  });
                }}
                disabled={readOnly}
              />
            </Label>
          </div>
          <div />
        </div>
      );
  }
}
