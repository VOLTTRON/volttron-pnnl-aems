import { Button, Checkbox, InputGroup, Intent, Label } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { HolidayType, ReadUnitQuery } from "@/graphql-codegen/graphql";
import { DeepPartial, ObservanceType } from "@local/common";
import { cloneDeep, merge } from "lodash";

export type HolidayCreateDelete = NonNullable<NonNullable<UnitType["configuration"]>["holidays"]>[number] & {
  action?: "create" | "delete";
  createdAt?: string;
};

type UnitType = NonNullable<ReadUnitQuery["readUnit"]>;

interface HolidayProps {
  id: string;
  unit: UnitType | null;
  editing: DeepPartial<UnitType> | null;
  setEditing: (editing: DeepPartial<UnitType> | null) => void;
  readOnly?: boolean;
}

export function Holiday({ id, unit, editing, setEditing, readOnly }: HolidayProps) {
  const holiday = merge(
    {},
    unit?.configuration?.holidays?.find((h) => h?.id === id),
    editing?.configuration?.holidays?.find((h) => h?.id === id),
  );
  const { label, type, month, day, observance } = holiday;

  const formatDate = (month: number, day: number) => {
    try {
      const date = new Date(2024, month - 1, day);
      return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    } catch {
      return `${month}/${day}`;
    }
  };

  switch (type) {
    case "Custom":
      const suffix = ObservanceType.parse(observance ?? "")?.label;
      const desc = `${formatDate(month as number, day as number)}${suffix ? ` (${suffix})` : ""}`;

      return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0" }}>
          <div style={{ flex: 1 }}>
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
                const clone = cloneDeep(editing ?? {});
                clone.configuration = clone.configuration ?? {};
                clone.configuration.holidays = clone.configuration?.holidays ?? [];
                let holiday: HolidayCreateDelete | undefined = clone.configuration.holidays.find((h) => h?.id === id);
                if (!holiday) {
                  holiday = { id };
                  clone.configuration.holidays.push(holiday);
                }
                holiday.action = "delete";
                setEditing(clone);
              }}
              disabled={readOnly}
            />
          </div>
        </div>
      );

    case "Enabled":
    case "Disabled":
    default:
      return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0" }}>
          <div style={{ flex: 1 }}>
            <Label>
              <b>{label}</b>
              <Checkbox
                label="Enabled"
                checked={type === HolidayType.Enabled}
                indeterminate={type == null}
                onClick={() => {
                  const clone = cloneDeep(editing ?? {});
                  clone.configuration = clone.configuration ?? {};
                  clone.configuration.holidays = clone.configuration.holidays ?? [];
                  let holiday: HolidayCreateDelete | undefined = clone.configuration.holidays.find((h) => h?.id === id);
                  if (!holiday) {
                    holiday = { id };
                    clone.configuration.holidays.push(holiday);
                  }
                  holiday.type = type === HolidayType.Enabled ? HolidayType.Disabled : HolidayType.Enabled;
                  setEditing(clone);
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
