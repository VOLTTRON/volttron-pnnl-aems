import { IUnit } from "controllers/units/action";
import { Setpoint } from "./Setpoint";
import { get } from "lodash";
import { DeepPartial } from "../../utils/types";

export function Setpoints(props: {
  unit: IUnit;
  editing: DeepPartial<IUnit> | null;
  handleChange: (field: string, unit?: DeepPartial<IUnit> | null) => (value: any) => void;
}) {
  const { unit, editing, handleChange } = props;
  return (
    <Setpoint
      type="separate"
      title="Setpoints"
      path="configuration.setpoint"
      unit={unit}
      editing={editing}
      setpoint={get(editing, "configuration.setpoint")}
      handleChange={handleChange}
    />
  );
}
