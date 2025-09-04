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
  Intent,
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { useCallback } from "react";
import { LocationSearch } from "./LocationSearch";

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

// Zone type options (matching the original deprecated implementation)
const ZoneLocationOptions = [
  { name: "exterior", label: "Exterior" },
  { name: "interior", label: "Interior" },
];

const ZoneMassOptions = [
  { name: "high", label: "High" },
  { name: "medium", label: "Medium" },
  { name: "low", label: "Low" },
];

const ZoneOrientationOptions = [
  { name: "north", label: "North" },
  { name: "northeast", label: "Northeast" },
  { name: "east", label: "East" },
  { name: "southeast", label: "Southeast" },
  { name: "south", label: "South" },
  { name: "southwest", label: "Southwest" },
  { name: "west", label: "West" },
  { name: "northwest", label: "Northwest" },
];

const ZoneBuildingOptions = [
  { name: "corner-office", label: "Corner Office" },
  { name: "conference", label: "Conference" },
  { name: "kitchen", label: "Kitchen" },
  { name: "closet", label: "Closet" },
  { name: "office", label: "Office" },
  { name: "empty-office", label: "Empty Office" },
  { name: "mechanical-room", label: "Mechanical Room" },
  { name: "computer-lab", label: "Computer Lab" },
  { name: "mixed", label: "Mixed" },
  { name: "other", label: "Other" },
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
    const numericValue = typeof value === 'number' ? value : (parseFloat(value) || 0);
    const isValid = numericValue >= min && numericValue <= max;
    
    return (
      <Label>
        <b>{label}</b>
        <NumericInput
          step={fractions ? 0.5 : 1}
          min={min}
          max={max}
          value={numericValue}
          onValueChange={(v) => {
            // Validate the value before updating
            if (typeof v === 'number' && !isNaN(v)) {
              handleChange(path)(v);
            }
          }}
          rightElement={element}
          clampValueOnBlur
          disabled={disabled}
          intent={!isValid && numericValue !== 0 ? Intent.DANGER : Intent.NONE}
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
        <div className="row">
          <h3> </h3>
          <div className="unit">
            <Label>
              <b>Unit Label</b>
              <InputGroup
                type="text"
                value={getValue("label") || ""}
                onChange={(e) => handleChange("label")(e.target.value)}
              />
            </Label>
          </div>
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("location") && (
        <div className="row">
          <div>
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
          </div>
          <div>
            <Label>
              <b>Location Search</b>
              <LocationSearch
                value={getValue("location.name") || ""}
                onLocationSelect={(location) => {
                  handleChange("location.name")(location.name);
                  handleChange("location.latitude")(location.latitude);
                  handleChange("location.longitude")(location.longitude);
                }}
                placeholder="Search for unit location..."
              />
            </Label>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <div style={{ flex: 1 }}>
                {renderNumeric("Longitude", -180, 180, "location.longitude", undefined, true)}
              </div>
              <div style={{ flex: 1 }}>
                {renderNumeric("Latitude", -90, 90, "location.latitude", undefined, true)}
              </div>
            </div>
          </div>
        </div>
      )}

      {!hidden?.includes("peakLoadExclude") && (
        <div className="row">
          <div className="select">
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
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("coolingPeakOffset") && (
        <div className="row">
          <div className="unit">
            {renderTemperatureSlider(
              "Cooling Offset During Grid Services",
              COOLING_PEAK_OFFSET_MIN,
              COOLING_PEAK_OFFSET_MAX,
              1,
              "coolingPeakOffset",
              getValue("peakLoadExclude")
            )}
          </div>
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("heatingPeakOffset") && (
        <div className="row">
          <div className="unit">
            {renderTemperatureSlider(
              "Heating Offset During Grid Services",
              HEATING_PEAK_OFFSET_MIN,
              HEATING_PEAK_OFFSET_MAX,
              1,
              "heatingPeakOffset",
              getValue("peakLoadExclude")
            )}
          </div>
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("zoneLocation") && (
        <div className="row">
          <div className="select">
            {renderSelect("Zone Location", ZoneLocationOptions, "zoneLocation")}
          </div>
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("zoneMass") && (
        <div className="row">
          <div className="select">
            {renderSelect("Zone Mass", ZoneMassOptions, "zoneMass")}
          </div>
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("zoneOrientation") && (
        <div className="row">
          <div className="select">
            {renderSelect("Zone Orientation", ZoneOrientationOptions, "zoneOrientation")}
          </div>
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("zoneBuilding") && (
        <div className="row">
          <div className="select">
            {renderSelect("Zone Type", ZoneBuildingOptions, "zoneBuilding")}
          </div>
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("coolingCapacity") && (
        <div className="row">
          <div className="unit">
            {renderNumeric(
              "Rated Cooling Capacity",
              COOLING_CAPACITY_MIN,
              COOLING_CAPACITY_MAX,
              "coolingCapacity",
              <Tag minimal>tons</Tag>,
              true
            )}
          </div>
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("compressors") && (
        <div className="row">
          <div className="unit">
            {renderNumeric("Number of Compressors", COMPRESSORS_MIN, COMPRESSORS_MAX, "compressors")}
          </div>
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("optimalStartLockout") && (
        <div className="row">
          <div className="unit">
            {renderTemperatureSlider(
              "Disable Optimal Start when Outdoor Temperatures are below",
              OPTIMAL_START_LOCKOUT_MIN,
              OPTIMAL_START_LOCKOUT_MAX,
              5,
              "optimalStartLockout"
            )}
          </div>
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("optimalStartDeviation") && (
        <div className="row">
          <div className="unit">
            {renderTemperatureSlider(
              "Optimal Start Allowable Zone Temperature Deviation",
              OPTIMAL_START_DEVIATION_MIN,
              OPTIMAL_START_DEVIATION_MAX,
              0.5,
              "optimalStartDeviation"
            )}
          </div>
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("earliestStart") && (
        <div className="row">
          <div className="unit">
            {renderDurationSlider(
              "Earliest Start Time Before Occupancy",
              EARLIEST_START_MIN,
              EARLIEST_START_MAX,
              30,
              "earliestStart"
            )}
          </div>
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("latestStart") && (
        <div className="row">
          <div className="unit">
            {renderDurationSlider(
              "Latest Start Time Before Occupancy",
              LATEST_START_MIN,
              LATEST_START_MAX,
              15,
              "latestStart"
            )}
          </div>
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("heatPump") && (
        <div className="row">
          <div className="select">
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
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("heatPumpBackup") && (
        <div className="row">
          <div className="unit">
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
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("heatPumpLockout") && (
        <div className="row">
          <div className="unit">
            {renderTemperatureSlider(
              "Heat Pump Auxiliary Heat Lockout",
              HEAT_PUMP_LOCKOUT_MIN,
              HEAT_PUMP_LOCKOUT_MAX,
              8,
              "heatPumpLockout",
              !getValue("heatPump") // Disabled if heat pump is not selected
            )}
          </div>
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("economizer") && (
        <div className="row">
          <div className="select">
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
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("economizerSetpoint") && (
        <div className="row">
          <div className="unit">
            {renderTemperatureSlider(
              "Economizer Switchover Temperature Setpoint",
              ECONOMIZER_SETPOINT_MIN,
              ECONOMIZER_SETPOINT_MAX,
              5,
              "economizerSetpoint",
              !getValue("economizer") // Disabled if economizer is not selected
            )}
          </div>
          <div />
          <div />
        </div>
      )}

      {!hidden?.includes("coolingLockout") && (
        <div className="row">
          <div className="unit">
            {renderTemperatureSlider(
              "Compressor Cooling Lockout Temperature",
              COOLING_LOCKOUT_MIN,
              COOLING_LOCKOUT_MAX,
              5,
              "coolingLockout",
              !getValue("economizer") // Disabled if economizer is not selected
            )}
          </div>
          <div />
          <div />
        </div>
      )}
    </div>
  );
}
