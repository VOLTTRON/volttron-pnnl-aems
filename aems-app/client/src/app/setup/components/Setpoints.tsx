import { 
  InputGroup, 
  Label, 
  NumericInput,
  Switch,
  FormGroup
} from "@blueprintjs/core";
import { useCallback } from "react";
import { get } from "lodash";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface SetpointsProps {
  unit: any;
  editing: DeepPartial<any> | null;
  handleChange: (field: string, editingUnit?: DeepPartial<any> | null) => (value: any) => void;
  readOnly?: boolean;
}

export function Setpoints({ unit, editing, handleChange, readOnly = false }: SetpointsProps) {
  const getValue = useCallback((field: string) => {
    return get(editing, field, get(unit, field));
  }, [editing, unit]);

  return (
    <div style={{ padding: '1rem' }}>
      <FormGroup label="Setpoint Configuration">
        <Label>
          <b>Setpoint Label</b>
          <InputGroup
            type="text"
            value={getValue("configuration.setpoint.label") || ""}
            onChange={(e) => handleChange("configuration.setpoint.label", editing)(e.target.value)}
            readOnly={readOnly}
            placeholder="Enter setpoint label"
          />
        </Label>
      </FormGroup>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <FormGroup label="Cooling Temperature">
          <Label>
            <b>Cooling Setpoint (°F)</b>
            <NumericInput
              value={getValue("configuration.setpoint.cooling") || 75}
              onValueChange={(value) => handleChange("configuration.setpoint.cooling", editing)(value)}
              min={60}
              max={85}
              stepSize={1}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>

        <FormGroup label="Heating Temperature">
          <Label>
            <b>Heating Setpoint (°F)</b>
            <NumericInput
              value={getValue("configuration.setpoint.heating") || 70}
              onValueChange={(value) => handleChange("configuration.setpoint.heating", editing)(value)}
              min={60}
              max={80}
              stepSize={1}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <FormGroup label="Deadband">
          <Label>
            <b>Deadband (°F)</b>
            <NumericInput
              value={getValue("configuration.setpoint.deadband") || 2}
              onValueChange={(value) => handleChange("configuration.setpoint.deadband", editing)(value)}
              min={1}
              max={10}
              stepSize={0.5}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>

        <FormGroup label="Base Setpoint">
          <Label>
            <b>Base Setpoint (°F)</b>
            <NumericInput
              value={getValue("configuration.setpoint.setpoint") || 72}
              onValueChange={(value) => handleChange("configuration.setpoint.setpoint", editing)(value)}
              min={60}
              max={85}
              stepSize={1}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <FormGroup>
          <Label>
            <Switch
              checked={getValue("configuration.setpoint.occupied") || false}
              onChange={(e) => handleChange("configuration.setpoint.occupied", editing)(e.currentTarget.checked)}
              disabled={readOnly}
              label="Occupied Mode"
            />
          </Label>
        </FormGroup>
      </div>

      <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--bp5-background-color-secondary)', borderRadius: '4px' }}>
        <small style={{ color: 'var(--bp5-text-color-muted)' }}>
          <strong>Note:</strong> Cooling setpoint should be higher than heating setpoint. 
          The deadband creates a temperature range where neither heating nor cooling operates.
        </small>
      </div>
    </div>
  );
}
