"use client";

import {
  InputGroup,
  Label,
  NumericInput,
  Tag,
  HTMLSelect,
} from "@blueprintjs/core";
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
    return editing?.[field] ?? unit?.[field];
  }, [editing, unit]);

  const renderNumeric = (
    label: string,
    min: number,
    max: number,
    path: string,
    element?: JSX.Element,
    fractions?: boolean
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

  return (
    <div style={{ padding: "16px", backgroundColor: "#f5f8fa" }}>
      {!hidden?.includes("label") && (
        <div style={{ marginBottom: "16px" }}>
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
        <div style={{ marginBottom: "16px" }}>
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
        <div style={{ marginBottom: "16px" }}>
          {renderNumeric(
            "Cooling Offset During Grid Services (°F)",
            COOLING_PEAK_OFFSET_MIN,
            COOLING_PEAK_OFFSET_MAX,
            "coolingPeakOffset",
            <Tag minimal>°F</Tag>,
            true
          )}
        </div>
      )}

      {!hidden?.includes("heatingPeakOffset") && (
        <div style={{ marginBottom: "16px" }}>
          {renderNumeric(
            "Heating Offset During Grid Services (°F)",
            HEATING_PEAK_OFFSET_MIN,
            HEATING_PEAK_OFFSET_MAX,
            "heatingPeakOffset",
            <Tag minimal>°F</Tag>,
            true
          )}
        </div>
      )}

      {!hidden?.includes("zoneLocation") && (
        <div style={{ marginBottom: "16px" }}>
          {renderSelect("Zone Location", ZoneLocationOptions, "zoneLocation")}
        </div>
      )}

      {!hidden?.includes("zoneMass") && (
        <div style={{ marginBottom: "16px" }}>
          {renderSelect("Zone Mass", ZoneMassOptions, "zoneMass")}
        </div>
      )}

      {!hidden?.includes("zoneOrientation") && (
        <div style={{ marginBottom: "16px" }}>
          {renderSelect("Zone Orientation", ZoneOrientationOptions, "zoneOrientation")}
        </div>
      )}

      {!hidden?.includes("zoneBuilding") && (
        <div style={{ marginBottom: "16px" }}>
          {renderSelect("Zone Type", ZoneBuildingOptions, "zoneBuilding")}
        </div>
      )}

      {!hidden?.includes("coolingCapacity") && (
        <div style={{ marginBottom: "16px" }}>
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
        <div style={{ marginBottom: "16px" }}>
          {renderNumeric("Number of Compressors", COMPRESSORS_MIN, COMPRESSORS_MAX, "compressors")}
        </div>
      )}

      {!hidden?.includes("heatPump") && (
        <div style={{ marginBottom: "16px" }}>
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
        <div style={{ marginBottom: "16px" }}>
          {renderNumeric(
            "Heat Pump Electric Backup Capacity",
            HEAT_PUMP_BACKUP_MIN,
            HEAT_PUMP_BACKUP_MAX,
            "heatPumpBackup",
            <Tag minimal>kW</Tag>,
            true
          )}
        </div>
      )}

      {!hidden?.includes("economizer") && (
        <div style={{ marginBottom: "16px" }}>
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
        <div style={{ marginBottom: "16px" }}>
          {renderNumeric(
            "Economizer Switchover Temperature Setpoint",
            ECONOMIZER_SETPOINT_MIN,
            ECONOMIZER_SETPOINT_MAX,
            "economizerSetpoint",
            <Tag minimal>°F</Tag>,
            true
          )}
        </div>
      )}
    </div>
  );
}
