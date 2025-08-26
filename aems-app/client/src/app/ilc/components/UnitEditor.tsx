"use client";

import {
  InputGroup,
  Label,
  NumericInput,
  Tag,
  HTMLSelect,
  Button,
  MultiSlider,
  HandleType,
  HandleInteractionKind,
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { useCallback } from "react";

// HVAC parameter constants (matching the deprecated implementation)
const COOLING_CAPACITY_MIN = 0;
const COOLING_CAPACITY_MAX = 100;
const COMPRESSORS_MIN = 1;
const COMPRESSORS_MAX = 10;
const COOLING_LOCKOUT_MIN = 32;
const COOLING_LOCKOUT_MAX = 80;
const OPTIMAL_START_LOCKOUT_MIN = 0;
const OPTIMAL_START_LOCKOUT_MAX = 50;
const OPTIMAL_START_DEVIATION_MIN = 0;
const OPTIMAL_START_DEVIATION_MAX = 10;
const EARLIEST_START_MIN = 0;
const EARLIEST_START_MAX = 240;
const LATEST_START_MIN = 0;
const LATEST_START_MAX = 120;
const HEAT_PUMP_BACKUP_MIN = 0;
const HEAT_PUMP_BACKUP_MAX = 50;
const HEAT_PUMP_LOCKOUT_MIN = 0;
const HEAT_PUMP_LOCKOUT_MAX = 50;
const ECONOMIZER_SETPOINT_MIN = 45;
const ECONOMIZER_SETPOINT_MAX = 75;
const COOLING_PEAK_OFFSET_MIN = 0;
const COOLING_PEAK_OFFSET_MAX = 10;
const HEATING_PEAK_OFFSET_MIN = -10;
const HEATING_PEAK_OFFSET_MAX = 0;

// Zone type options (simplified for now)
const ZoneLocationOptions = [
  { name: "interior", label: "Interior" },
  { name: "perimeter", label: "Perimeter" },
  { name: "corner", label: "Corner" },
];

const ZoneMassOptions = [
  { name: "light", label: "Light" },
  { name: "medium", label: "Medium" },
  { name: "heavy", label: "Heavy" },
];

const ZoneOrientationOptions = [
  { name: "north", label: "North" },
  { name: "south", label: "South" },
  { name: "east", label: "East" },
  { name: "west", label: "West" },
];

const ZoneBuildingOptions = [
  { name: "office", label: "Office" },
  { name: "retail", label: "Retail" },
  { name: "warehouse", label: "Warehouse" },
];

interface UnitEditorProps {
  unit: any;
  editing: any;
  handleChange: (field: string) => (value: any) => void;
  hidden?: string[];
}

export function UnitEditor({ unit, editing, handleChange, hidden = [] }: UnitEditorProps) {
  const getValue = useCallback((field: string) => {
    // Handle nested field paths (e.g., "location.name")
    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      const editingParent = editing?.[parentField];
      const unitParent = unit?.[parentField];
      
      if (editingParent && typeof editingParent === 'object') {
        return editingParent[childField];
      }
      if (unitParent && typeof unitParent === 'object') {
        return unitParent[childField];
      }
      return undefined;
    }
    
    const value = editing?.[field] ?? unit?.[field];
    
    // Debug logging for specific fields
    if (field === 'zoneLocation' || field === 'heatPumpBackup') {
      console.log(`UnitEditor getValue for ${field}:`, { 
        field, 
        editingValue: editing?.[field], 
        unitValue: unit?.[field], 
        finalValue: value 
      });
    }
    
    return value;
  }, [editing, unit]);

  const renderNumeric = (
    label: string,
    min: number,
    max: number,
    path: string,
    element?: JSX.Element,
    fractions?: boolean,
    disabled?: boolean
  ) => {
    const value = getValue(path);
    return (
      <Label>
        <b>{label}</b>
        <NumericInput
          step={fractions ? 0.5 : 1}
          min={min}
          max={max}
          value={value || 0}
          onValueChange={(v) => handleChange(path)(v)}
          rightElement={element}
          clampValueOnBlur
          disabled={disabled}
        />
      </Label>
    );
  };

  const renderSelect = (
    label: string,
    values: Array<{ name: any; label: string }>,
    path: string,
    transform?: (v: any) => string
  ) => {
    const value = getValue(path);
    return (
      <Label>
        <b>{label}</b>
        <HTMLSelect
          value={value || ""}
          onChange={(e) => handleChange(path)(e.target.value)}
          fill
        >
          <option value="">Select {label.toLowerCase()}...</option>
          {values?.map((option) => (
            <option key={option.label} value={option.name}>
              {option.label}
            </option>
          ))}
        </HTMLSelect>
      </Label>
    );
  };

  const renderTemperatureSlider = (
    label: string,
    min: number,
    max: number,
    step: number,
    path: string,
    disabled?: boolean
  ) => {
    const value = getValue(path) || min;
    return (
      <Label>
        <b>{label}</b>
        <MultiSlider
          min={min}
          max={max}
          stepSize={0.5}
          labelStepSize={step}
          labelRenderer={(v, o) => (o?.isHandleTooltip || (v > min && v < max) ? `${v}°F` : "")}
          disabled={disabled}
        >
          <MultiSlider.Handle
            type={HandleType.FULL}
            interactionKind={HandleInteractionKind.LOCK}
            value={value}
            onChange={(v) => handleChange(path)(v)}
          />
        </MultiSlider>
      </Label>
    );
  };

  const renderDurationSlider = (
    label: string,
    min: number,
    max: number,
    step: number,
    path: string,
    disabled?: boolean
  ) => {
    const value = getValue(path) || min;
    return (
      <Label>
        <b>{label}</b>
        <MultiSlider
          min={min}
          max={max}
          stepSize={5}
          labelStepSize={step}
          labelRenderer={(v, o) => (o?.isHandleTooltip || (v > min && v < max) ? `${v} min` : "")}
          disabled={disabled}
        >
          <MultiSlider.Handle
            type={HandleType.FULL}
            interactionKind={HandleInteractionKind.LOCK}
            value={value}
            onChange={(v) => handleChange(path)(v)}
          />
        </MultiSlider>
      </Label>
    );
  };

  return (
    <div className="unit-editor">
      {!hidden?.includes("label") && (
        <div className="field-group">
          <Label>
            <b>Unit Label</b>
            <InputGroup
              type="text"
              value={getValue("label") || ""}
              onChange={(e) => handleChange("label")(e.target.value)}
            />
          </Label>
        </div>
      )}

      {!hidden?.includes("peakLoadExclude") && (
        <div className="field-group">
          {renderSelect(
            "Participate in Grid Services",
            [
              { name: false, label: "Yes" },
              { name: true, label: "No" },
            ],
            "peakLoadExclude",
            (v) => (v ? "No" : "Yes")
          )}
        </div>
      )}

      {!hidden?.includes("coolingPeakOffset") && (
        <div className="field-group">
          {renderTemperatureSlider(
            "Cooling Offset During Grid Services",
            COOLING_PEAK_OFFSET_MIN,
            COOLING_PEAK_OFFSET_MAX,
            1,
            "coolingPeakOffset",
            getValue("peakLoadExclude")
          )}
        </div>
      )}

      {!hidden?.includes("heatingPeakOffset") && (
        <div className="field-group">
          {renderTemperatureSlider(
            "Heating Offset During Grid Services",
            HEATING_PEAK_OFFSET_MIN,
            HEATING_PEAK_OFFSET_MAX,
            1,
            "heatingPeakOffset",
            getValue("peakLoadExclude")
          )}
        </div>
      )}

      {!hidden?.includes("zoneLocation") && (
        <div className="field-group">
          {renderSelect("Zone Location", ZoneLocationOptions, "zoneLocation")}
        </div>
      )}

      {!hidden?.includes("zoneMass") && (
        <div className="field-group">
          {renderSelect("Zone Mass", ZoneMassOptions, "zoneMass")}
        </div>
      )}

      {!hidden?.includes("zoneOrientation") && (
        <div className="field-group">
          {renderSelect("Zone Orientation", ZoneOrientationOptions, "zoneOrientation")}
        </div>
      )}

      {!hidden?.includes("zoneBuilding") && (
        <div className="field-group">
          {renderSelect("Zone Type", ZoneBuildingOptions, "zoneBuilding")}
        </div>
      )}

      {!hidden?.includes("coolingCapacity") && (
        <div className="field-group">
          {renderNumeric(
            "Rated Cooling Capacity",
            COOLING_CAPACITY_MIN,
            COOLING_CAPACITY_MAX,
            "coolingCapacity",
            <Tag minimal>tons</Tag>,
            true
          )}
        </div>
      )}

      {!hidden?.includes("compressors") && (
        <div className="field-group">
          {renderNumeric("Number of Compressors", COMPRESSORS_MIN, COMPRESSORS_MAX, "compressors")}
        </div>
      )}

      {!hidden?.includes("heatPump") && (
        <div className="field-group">
          {renderSelect(
            "Heat Pump",
            [
              { name: true, label: "Yes" },
              { name: false, label: "No" },
            ],
            "heatPump",
            (v) => (v ? "Yes" : "No")
          )}
        </div>
      )}

      {!hidden?.includes("heatPumpBackup") && (
        <div className="field-group">
          {renderNumeric(
            "Heat Pump Electric Backup Capacity",
            HEAT_PUMP_BACKUP_MIN,
            HEAT_PUMP_BACKUP_MAX,
            "heatPumpBackup",
            <Tag minimal>kW</Tag>,
            true,
            !getValue("heatPump") // Disabled if heat pump is not selected
          )}
        </div>
      )}

      {!hidden?.includes("economizer") && (
        <div className="field-group">
          {renderSelect(
            "Economizer",
            [
              { name: true, label: "Yes" },
              { name: false, label: "No" },
            ],
            "economizer",
            (v) => (v ? "Yes" : "No")
          )}
        </div>
      )}

      {!hidden?.includes("economizerSetpoint") && (
        <div className="field-group">
          {renderTemperatureSlider(
            "Economizer Switchover Temperature Setpoint",
            ECONOMIZER_SETPOINT_MIN,
            ECONOMIZER_SETPOINT_MAX,
            5,
            "economizerSetpoint",
            !getValue("economizer") // Disabled if economizer is not selected
          )}
        </div>
      )}

      {!hidden?.includes("location") && (
        <div style={{ marginBottom: "16px" }}>
          <Label>
            <b>Unit Location</b>
            <InputGroup
              type="text"
              value={getValue("location.name") || "No location set"}
              readOnly
              rightElement={
                <Button 
                  icon={IconNames.MAP} 
                  minimal 
                  onClick={() => {
                    const lat = getValue("location.latitude");
                    const lng = getValue("location.longitude");
                    const mapUrl = lat && lng 
                      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                      : `https://www.google.com/maps/@?api=1&map_action=map`;
                    window.open(mapUrl, "_blank");
                  }}
                />
              }
            />
          </Label>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <div style={{ flex: 1 }}>
              <Label>
                <b>Location Name</b>
                <InputGroup
                  type="text"
                  value={getValue("location.name") || ""}
                  onChange={(e) => handleChange("location.name")(e.target.value)}
                  placeholder="Enter location name"
                />
              </Label>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <div style={{ flex: 1 }}>
              {renderNumeric(
                "Latitude",
                -90,
                90,
                "location.latitude",
                undefined,
                true
              )}
            </div>
            <div style={{ flex: 1 }}>
              {renderNumeric(
                "Longitude",
                -180,
                180,
                "location.longitude",
                undefined,
                true
              )}
            </div>
          </div>
        </div>
      )}

      {!hidden?.includes("optimalStartLockout") && (
        <div style={{ marginBottom: "16px" }}>
          {renderTemperatureSlider(
            "Disable Optimal Start when Outdoor Temperatures are below",
            OPTIMAL_START_LOCKOUT_MIN,
            OPTIMAL_START_LOCKOUT_MAX,
            5,
            "optimalStartLockout"
          )}
        </div>
      )}

      {!hidden?.includes("optimalStartDeviation") && (
        <div style={{ marginBottom: "16px" }}>
          {renderTemperatureSlider(
            "Optimal Start Allowable Zone Temperature Deviation",
            OPTIMAL_START_DEVIATION_MIN,
            OPTIMAL_START_DEVIATION_MAX,
            0.5,
            "optimalStartDeviation"
          )}
        </div>
      )}

      {!hidden?.includes("earliestStart") && (
        <div style={{ marginBottom: "16px" }}>
          {renderDurationSlider(
            "Earliest Start Time Before Occupancy",
            EARLIEST_START_MIN,
            EARLIEST_START_MAX,
            30,
            "earliestStart"
          )}
        </div>
      )}

      {!hidden?.includes("latestStart") && (
        <div style={{ marginBottom: "16px" }}>
          {renderDurationSlider(
            "Latest Start Time Before Occupancy",
            LATEST_START_MIN,
            LATEST_START_MAX,
            15,
            "latestStart"
          )}
        </div>
      )}

      {!hidden?.includes("heatPumpLockout") && (
        <div style={{ marginBottom: "16px" }}>
          {renderTemperatureSlider(
            "Heat Pump Auxiliary Heat Lockout",
            HEAT_PUMP_LOCKOUT_MIN,
            HEAT_PUMP_LOCKOUT_MAX,
            8,
            "heatPumpLockout",
            !getValue("heatPump") // Disabled if heat pump is not selected
          )}
        </div>
      )}

      {!hidden?.includes("coolingLockout") && (
        <div style={{ marginBottom: "16px" }}>
          {renderTemperatureSlider(
            "Compressor Cooling Lockout Temperature",
            COOLING_LOCKOUT_MIN,
            COOLING_LOCKOUT_MAX,
            5,
            "coolingLockout",
            !getValue("economizer") // Disabled if economizer is not selected
          )}
        </div>
      )}
    </div>
  );
}
