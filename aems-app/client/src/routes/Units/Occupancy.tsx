import { Button, InputGroup, Intent, Label } from "@blueprintjs/core";

import { IOccupancy } from "controllers/occupancies/action";
import { IUnit } from "controllers/units/action";
import { IconNames } from "@blueprintjs/icons";
import moment from "moment";
import { DeepPartial } from "../../utils/types";

export function Occupancy(props: {
  path: string;
  unit: DeepPartial<IUnit> | IUnit;
  editing: DeepPartial<IUnit> | null;
  occupancy: DeepPartial<IOccupancy>;
  handleChange: (field: string, unit?: DeepPartial<IUnit> | null) => (value: any) => void;
}) {
  const { path, editing, occupancy, handleChange } = props;
  const { id, label, date, schedule } = occupancy;

  const suffix = schedule?.label;
  const desc = `${moment(date).format("dddd MMMM Do YYYY")} ${suffix && `(${suffix})`}`;
  const disable = moment(date).startOf("day").isBefore(moment().startOf("day"), "day");

  return (
    <>
      <div className="row">
        <div>
          <Label disabled={disable}>
            <b>{label}</b>
            <InputGroup type="text" value={desc} disabled={disable} readOnly />
          </Label>
        </div>
        <div>
          <Button
            icon={IconNames.TRASH}
            intent={Intent.WARNING}
            minimal
            onClick={() => {
              handleChange(path, editing)({ id: id, action: "delete" });
            }}
          />
        </div>
      </div>
    </>
  );
}
