import { IUnit } from "controllers/units/action";
import { Schedule } from "./Schedule";
import { parseBoolean } from "utils/utils";
import { DeepPartial } from "../../utils/types";

const holidaySchedule = parseBoolean(process.env.REACT_APP_HOLIDAY_SCHEDULE ?? "");

export function Schedules(props: {
  unit: IUnit;
  editing: DeepPartial<IUnit> | null;
  handleChange: (field: string, unit?: DeepPartial<IUnit> | null) => (value: any) => void;
}) {
  const { unit, editing, handleChange } = props;
  return (
    <>
      <Schedule
        title="Monday Schedule"
        path="configuration.mondaySchedule"
        unit={unit}
        editing={editing}
        handleChange={handleChange}
      />
      <Schedule
        title="Tuesday Schedule"
        path="configuration.tuesdaySchedule"
        unit={unit}
        editing={editing}
        handleChange={handleChange}
      />
      <Schedule
        title="Wednesday Schedule"
        path="configuration.wednesdaySchedule"
        unit={unit}
        editing={editing}
        handleChange={handleChange}
      />
      <Schedule
        title="Thursday Schedule"
        path="configuration.thursdaySchedule"
        unit={unit}
        editing={editing}
        handleChange={handleChange}
      />
      <Schedule
        title="Friday Schedule"
        path="configuration.fridaySchedule"
        unit={unit}
        editing={editing}
        handleChange={handleChange}
      />
      <Schedule
        title="Saturday Schedule"
        path="configuration.saturdaySchedule"
        unit={unit}
        editing={editing}
        handleChange={handleChange}
      />
      <Schedule
        title="Sunday Schedule"
        path="configuration.sundaySchedule"
        unit={unit}
        editing={editing}
        handleChange={handleChange}
      />
      {holidaySchedule && (
        <Schedule
          title="Holiday Schedule"
          path="configuration.holidaySchedule"
          unit={unit}
          editing={editing}
          handleChange={handleChange}
        />
      )}
    </>
  );
}
