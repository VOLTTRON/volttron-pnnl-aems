import { 
  InputGroup, 
  Label, 
  FormGroup,
  HTMLSelect,
  Button
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

export function Configuration({ unit, editing, handleChange, configurations = [], readOnly = false }: ConfigurationProps) {
  const getValue = useCallback((field: string) => {
    return get(editing, field, get(unit, field));
  }, [editing, unit]);

  const handleCreateConfiguration = useCallback(() => {
    // Create a new configuration with default values
    const newConfiguration = {
      label: `Configuration for ${unit?.label || unit?.name || 'Unit'}`,
      unitId: unit?.id,
      setpoints: {
        cooling: 75,
        heating: 70,
        deadband: 2,
        setpoint: 72,
        occupied: true
      },
      schedule: {
        monday: { occupied: true, startTime: '08:00', endTime: '17:00' },
        tuesday: { occupied: true, startTime: '08:00', endTime: '17:00' },
        wednesday: { occupied: true, startTime: '08:00', endTime: '17:00' },
        thursday: { occupied: true, startTime: '08:00', endTime: '17:00' },
        friday: { occupied: true, startTime: '08:00', endTime: '17:00' },
        saturday: { occupied: false, startTime: '08:00', endTime: '17:00' },
        sunday: { occupied: false, startTime: '08:00', endTime: '17:00' }
      },
      holidays: [],
      occupancies: []
    };
    
    handleChange("configuration", editing)(newConfiguration);
  }, [unit, editing, handleChange]);

  const handleSelectConfiguration = useCallback((configurationId: string) => {
    const selectedConfig = configurations.find(c => c.id === configurationId);
    if (selectedConfig) {
      handleChange("configurationId", editing)(configurationId);
      handleChange("configuration", editing)(selectedConfig);
    }
  }, [configurations, editing, handleChange]);

  return (
    <div style={{ padding: '1rem' }}>
      {!readOnly && (
        <FormGroup label="Configuration Management">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <Label>
                <b>Select Existing Configuration</b>
                <HTMLSelect
                  value={getValue("configurationId") || ""}
                  onChange={(e) => handleSelectConfiguration(e.target.value)}
                  options={[
                    { value: "", label: "Select a configuration..." },
                    ...configurations.map(config => ({
                      value: config.id,
                      label: config.label || `Configuration ${config.id}`
                    }))
                  ]}
                />
              </Label>
            </div>
            <Button
              icon={IconNames.PLUS}
              onClick={handleCreateConfiguration}
            >
              New Configuration
            </Button>
          </div>
        </FormGroup>
      )}

      <FormGroup label="Configuration Details">
        <Label>
          <b>Configuration Label</b>
          <InputGroup
            type="text"
            value={getValue("configuration.label") || ""}
            onChange={(e) => handleChange("configuration.label", editing)(e.target.value)}
            readOnly={readOnly}
            placeholder="Enter configuration label"
          />
        </Label>
      </FormGroup>

      {getValue("configuration.id") && (
        <div style={{ marginTop: '1rem' }}>
          <FormGroup label="Configuration Information">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Label>
                <b>Configuration ID</b>
                <InputGroup
                  type="text"
                  value={getValue("configuration.id") || ""}
                  readOnly
                />
              </Label>
              
              <Label>
                <b>Unit ID</b>
                <InputGroup
                  type="text"
                  value={getValue("configuration.unitId") || unit?.id || ""}
                  readOnly
                />
              </Label>
            </div>
          </FormGroup>
        </div>
      )}

      <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--bp5-background-color-secondary)', borderRadius: '4px' }}>
        <small style={{ color: 'var(--bp5-text-color-muted)' }}>
          <strong>Note:</strong> Configurations contain all the settings for a unit including setpoints, schedules, and holidays. 
          You can create new configurations or select from existing ones to apply to this unit.
        </small>
      </div>
    </div>
  );
}
