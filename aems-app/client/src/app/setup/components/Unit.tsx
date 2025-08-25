import { 
  InputGroup, 
  Label, 
  NumericInput,
  Switch,
  FormGroup,
  HTMLSelect
} from "@blueprintjs/core";
import { useCallback } from "react";
import { get } from "lodash";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface UnitProps {
  unit: any;
  editing: DeepPartial<any> | null;
  handleChange: (field: string, editingUnit?: DeepPartial<any> | null) => (value: any) => void;
  readOnly?: boolean;
}

const ZONE_LOCATIONS = [
  { value: 'interior', label: 'Interior' },
  { value: 'perimeter', label: 'Perimeter' },
  { value: 'corner', label: 'Corner' },
  { value: 'top_floor', label: 'Top Floor' }
];

const ZONE_MASSES = [
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' }
];

const ZONE_ORIENTATIONS = [
  { value: 'north', label: 'North' },
  { value: 'south', label: 'South' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
  { value: 'northeast', label: 'Northeast' },
  { value: 'northwest', label: 'Northwest' },
  { value: 'southeast', label: 'Southeast' },
  { value: 'southwest', label: 'Southwest' }
];

const ZONE_BUILDINGS = [
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'school', label: 'School' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'hotel', label: 'Hotel' }
];

export function Unit({ unit, editing, handleChange, readOnly = false }: UnitProps) {
  const getValue = useCallback((field: string) => {
    return get(editing, field, get(unit, field));
  }, [editing, unit]);

  return (
    <div style={{ padding: '1rem' }}>
      <FormGroup label="Unit Information">
        <Label>
          <b>Unit Label</b>
          <InputGroup
            type="text"
            value={getValue("label") || ""}
            onChange={(e) => handleChange("label", editing)(e.target.value)}
            readOnly={readOnly}
            placeholder="Enter unit label"
          />
        </Label>
      </FormGroup>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <FormGroup label="Zone Configuration">
          <Label>
            <b>Zone Location</b>
            <HTMLSelect
              value={getValue("zoneLocation") || ""}
              onChange={(e) => handleChange("zoneLocation", editing)(e.target.value)}
              disabled={readOnly}
              options={[{ value: "", label: "Select zone location..." }, ...ZONE_LOCATIONS]}
            />
          </Label>
        </FormGroup>

        <FormGroup label="Zone Mass">
          <Label>
            <b>Zone Mass</b>
            <HTMLSelect
              value={getValue("zoneMass") || ""}
              onChange={(e) => handleChange("zoneMass", editing)(e.target.value)}
              disabled={readOnly}
              options={[{ value: "", label: "Select zone mass..." }, ...ZONE_MASSES]}
            />
          </Label>
        </FormGroup>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <FormGroup label="Zone Orientation">
          <Label>
            <b>Zone Orientation</b>
            <HTMLSelect
              value={getValue("zoneOrientation") || ""}
              onChange={(e) => handleChange("zoneOrientation", editing)(e.target.value)}
              disabled={readOnly}
              options={[{ value: "", label: "Select orientation..." }, ...ZONE_ORIENTATIONS]}
            />
          </Label>
        </FormGroup>

        <FormGroup label="Zone Building Type">
          <Label>
            <b>Building Type</b>
            <HTMLSelect
              value={getValue("zoneBuilding") || ""}
              onChange={(e) => handleChange("zoneBuilding", editing)(e.target.value)}
              disabled={readOnly}
              options={[{ value: "", label: "Select building type..." }, ...ZONE_BUILDINGS]}
            />
          </Label>
        </FormGroup>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <FormGroup label="Cooling Capacity">
          <Label>
            <b>Rated Cooling Capacity (tons)</b>
            <NumericInput
              value={getValue("coolingCapacity") || 0}
              onValueChange={(value) => handleChange("coolingCapacity", editing)(value)}
              min={0}
              max={100}
              stepSize={0.5}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>

        <FormGroup label="Compressors">
          <Label>
            <b>Number of Compressors</b>
            <NumericInput
              value={getValue("compressors") || 1}
              onValueChange={(value) => handleChange("compressors", editing)(value)}
              min={1}
              max={10}
              stepSize={1}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <FormGroup label="Optimal Start Configuration">
          <Label>
            <b>Optimal Start Lockout Temperature (°F)</b>
            <NumericInput
              value={getValue("optimalStartLockout") || 35}
              onValueChange={(value) => handleChange("optimalStartLockout", editing)(value)}
              min={0}
              max={50}
              stepSize={1}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>

        <FormGroup label="Temperature Deviation">
          <Label>
            <b>Allowable Zone Temperature Deviation (°F)</b>
            <NumericInput
              value={getValue("optimalStartDeviation") || 2}
              onValueChange={(value) => handleChange("optimalStartDeviation", editing)(value)}
              min={0.5}
              max={5}
              stepSize={0.5}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <FormGroup label="Start Time Limits">
          <Label>
            <b>Earliest Start Time (minutes before occupancy)</b>
            <NumericInput
              value={getValue("earliestStart") || 120}
              onValueChange={(value) => handleChange("earliestStart", editing)(value)}
              min={30}
              max={300}
              stepSize={15}
              fill
              disabled={readOnly}
            />
          </Label>
        </FormGroup>

        <FormGroup label="Latest Start Time">
          <Label>
            <b>Latest Start Time (minutes before occupancy)</b>
            <NumericInput
              value={getValue("latestStart") || 30}
              onValueChange={(value) => handleChange("latestStart", editing)(value)}
              min={15}
              max={120}
              stepSize={15}
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
              checked={getValue("heatPump") || false}
              onChange={(e) => handleChange("heatPump", editing)(e.currentTarget.checked)}
              disabled={readOnly}
              label="Heat Pump System"
            />
          </Label>
        </FormGroup>
      </div>

      {getValue("heatPump") && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <FormGroup label="Heat Pump Backup">
            <Label>
              <b>Electric Backup Capacity (kW)</b>
              <NumericInput
                value={getValue("heatPumpBackup") || 0}
                onValueChange={(value) => handleChange("heatPumpBackup", editing)(value)}
                min={0}
                max={50}
                stepSize={0.5}
                fill
                disabled={readOnly}
              />
            </Label>
          </FormGroup>

          <FormGroup label="Heat Pump Lockout">
            <Label>
              <b>Auxiliary Heat Lockout Temperature (°F)</b>
              <NumericInput
                value={getValue("heatPumpLockout") || 25}
                onValueChange={(value) => handleChange("heatPumpLockout", editing)(value)}
                min={0}
                max={50}
                stepSize={1}
                fill
                disabled={readOnly}
              />
            </Label>
          </FormGroup>
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <FormGroup>
          <Label>
            <Switch
              checked={getValue("economizer") || false}
              onChange={(e) => handleChange("economizer", editing)(e.currentTarget.checked)}
              disabled={readOnly}
              label="Economizer System"
            />
          </Label>
        </FormGroup>
      </div>

      {getValue("economizer") && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <FormGroup label="Economizer Setpoint">
            <Label>
              <b>Switchover Temperature Setpoint (°F)</b>
              <NumericInput
                value={getValue("economizerSetpoint") || 65}
                onValueChange={(value) => handleChange("economizerSetpoint", editing)(value)}
                min={50}
                max={80}
                stepSize={1}
                fill
                disabled={readOnly}
              />
            </Label>
          </FormGroup>

          <FormGroup label="Cooling Lockout">
            <Label>
              <b>Compressor Cooling Lockout Temperature (°F)</b>
              <NumericInput
                value={getValue("coolingLockout") || 55}
                onValueChange={(value) => handleChange("coolingLockout", editing)(value)}
                min={40}
                max={70}
                stepSize={1}
                fill
                disabled={readOnly}
              />
            </Label>
          </FormGroup>
        </div>
      )}

      <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--bp5-background-color-secondary)', borderRadius: '4px' }}>
        <small style={{ color: 'var(--bp5-text-color-muted)' }}>
          <strong>Note:</strong> RTU configuration settings affect system performance and energy efficiency. 
          Consult with HVAC professionals when making significant changes to these parameters.
        </small>
      </div>
    </div>
  );
}
