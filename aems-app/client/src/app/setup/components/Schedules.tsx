import { Schedule } from "./Schedule";
import { DeepPartial } from "@local/common";
import { ReadUnitQuery } from "@/graphql-codegen/graphql";

type UnitType = NonNullable<ReadUnitQuery["readUnit"]>;

interface SchedulesProps {
  unit: UnitType | null;
  editing: DeepPartial<UnitType> | null;
  setEditing?: (editing: DeepPartial<UnitType> | null) => void;
  readOnly?: boolean;
}

export function Schedules({ unit, editing, setEditing, readOnly = false }: SchedulesProps) {
  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ marginTop: "1rem" }}>
        <h4>Weekly Schedule</h4>
        <div
          style={{
            backgroundColor: "var(--bp5-background-color)",
            padding: "1rem",
            borderRadius: "4px",
            border: "1px solid var(--bp5-border-color)",
          }}
        >
          <Schedule
            title="Monday Schedule"
            id={unit?.configuration?.mondaySchedule?.id ?? ""}
            unit={unit}
            editing={editing}
            setEditing={setEditing}
            readOnly={readOnly ? ["title", "occupied", "unoccupied"] : undefined}
          />
          <Schedule
            title="Tuesday Schedule"
            id={unit?.configuration?.tuesdaySchedule?.id ?? ""}
            unit={unit}
            editing={editing}
            setEditing={setEditing}
            readOnly={readOnly ? ["title", "occupied", "unoccupied"] : undefined}
          />
          <Schedule
            title="Wednesday Schedule"
            id={unit?.configuration?.wednesdaySchedule?.id ?? ""}
            unit={unit}
            editing={editing}
            setEditing={setEditing}
            readOnly={readOnly ? ["title", "occupied", "unoccupied"] : undefined}
          />
          <Schedule
            title="Thursday Schedule"
            id={unit?.configuration?.thursdaySchedule?.id ?? ""}
            unit={unit}
            editing={editing}
            setEditing={setEditing}
            readOnly={readOnly ? ["title", "occupied", "unoccupied"] : undefined}
          />
          <Schedule
            title="Friday Schedule"
            id={unit?.configuration?.fridaySchedule?.id ?? ""}
            unit={unit}
            editing={editing}
            setEditing={setEditing}
            readOnly={readOnly ? ["title", "occupied", "unoccupied"] : undefined}
          />
          <Schedule
            title="Saturday Schedule"
            id={unit?.configuration?.saturdaySchedule?.id ?? ""}
            unit={unit}
            editing={editing}
            setEditing={setEditing}
            readOnly={readOnly ? ["title", "occupied", "unoccupied"] : undefined}
          />
          <Schedule
            title="Sunday Schedule"
            id={unit?.configuration?.sundaySchedule?.id ?? ""}
            unit={unit}
            editing={editing}
            setEditing={setEditing}
            readOnly={readOnly ? ["title", "occupied", "unoccupied"] : undefined}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: "1rem",
          padding: "0.5rem",
          backgroundColor: "var(--bp5-background-color-secondary)",
          borderRadius: "4px",
        }}
      >
        <small style={{ color: "var(--bp5-text-color-muted)" }}>
          <strong>Note:</strong> Occupied periods determine when the HVAC system maintains comfort setpoints. During
          unoccupied periods, the system uses energy-saving setback temperatures.
        </small>
      </div>
    </div>
  );
}
