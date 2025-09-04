import { Button, Checkbox, InputGroup, Intent, Label } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { get } from "lodash";
import { useCallback } from "react";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface HolidayProps {
  path: string;
  unit: DeepPartial<any> | any;
  editing: DeepPartial<any> | null;
  holiday: DeepPartial<any>;
  handleChange: (field: string, unit?: DeepPartial<any> | null) => (value: any) => void;
  readOnly?: boolean;
}

export function Holiday({ path, unit, editing, holiday, handleChange, readOnly }: HolidayProps) {
  const { id, label, type, month, day, observance } = holiday;

  const getValue = useCallback((field: string) => get(editing, field, get(unit, field)), [editing, unit]);

  const formatDate = (month: number, day: number) => {
    try {
      const date = new Date(2024, month - 1, day);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    } catch {
      return `${month}/${day}`;
    }
  };

  const getObservanceLabel = (observance: string) => {
    const observanceMap: Record<string, string> = {
      'after_nearest_workday': 'After Nearest Workday',
      'before_nearest_workday': 'Before Nearest Workday',
      'nearest_workday': 'Nearest Workday',
      'next_monday': 'Next Monday',
      'next_workday': 'Next Workday',
      'previous_workday': 'Previous Workday',
      'previous_friday': 'Previous Friday',
      'sunday_to_monday': 'Sunday to Monday',
    };
    return observanceMap[observance] || observance;
  };

  switch (type) {
    case "Custom":
      const suffix = observance ? getObservanceLabel(observance) : '';
      const desc = `${formatDate(month as number, day as number)}${suffix ? ` (${suffix})` : ''}`;

      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
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
                handleChange(path, editing)({ id: id, type: type, action: "delete" });
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
          <div style={{ flex: 1 }}>
            <Label>
              <b>{label}</b>
              <Checkbox
                label="Enabled"
                checked={getValue(`${path}.type`) === "Enabled"}
                indeterminate={getValue(`${path}.type`) == null}
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
