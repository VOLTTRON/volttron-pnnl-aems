import { 
  InputGroup, 
  Label, 
  FormGroup,
  Button,
  Menu,
  MenuItem,
  HTMLSelect
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { useCallback } from "react";
import { get } from "lodash";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface ConfigurationProps {
  unit: any;
  editing: DeepPartial<any> | null;
  handleChange: (field: string, editingUnit?: DeepPartial<any> | null) => (value: any) => void;
  configurations?: any[];
  readOnly?: boolean;
}

export function Configuration({ 
  unit, 
  editing, 
  configurations, 
  handleChange, 
  handleCreate, 
  readOnly = false 
}: ConfigurationProps & { 
  handleCreate?: (unit: any) => void;
}) {
  const getValue = useCallback((field: string) => get(editing, field, get(unit, field)), [editing, unit]);

  return (
    <>
      {!readOnly && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>
          <div>
            <Label>
              <h3>Select Configuration</h3>
              <Button
                rightIcon={IconNames.CARET_DOWN}
                minimal
                text={unit?.configuration?.label || "Select Configuration..."}
                onClick={() => {
                  // This would open a menu with configuration options
                  // For now, we'll use a simple approach
                }}
              />
            </Label>
          </div>
          <div />
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>
        <div>
          <Label>
            {readOnly ? <h3>Configuration Label</h3> : <b>Configuration Label</b>}
            <InputGroup
              type="text"
              value={getValue("configuration.label") || ""}
              onChange={(e) => handleChange("configuration.label", editing)(e.target.value)}
              readOnly={readOnly}
              placeholder="Enter configuration label"
            />
          </Label>
        </div>
        <div />
      </div>
    </>
  );
}
