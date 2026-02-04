"use client";

import {
  InputGroup,
  Label,
  FormGroup,
  Button,
  Menu,
  MenuItem,
  MultiSlider,
  HandleType,
  HandleInteractionKind,
  Popover,
  NumericInput,
  Tag,
  Intent,
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { cloneDeep, merge } from "lodash";
import { DeepPartial, Validate, Zone } from "@local/common";
import { ReadUnitQuery } from "@/graphql-codegen/graphql";
import { Location } from "@/app/setup/components/Location";

// Constants for validation (matching setup component pattern)
const OPTIMAL_START_LOCKOUT_MIN = (Validate.OptimalStartLockout.options?.min as number) ?? 0;
const OPTIMAL_START_LOCKOUT_MAX = (Validate.OptimalStartLockout.options?.max as number) ?? 50;
const OPTIMAL_START_DEVIATION_MIN = (Validate.OptimalStartDeviation.options?.min as number) ?? 0.5;
const OPTIMAL_START_DEVIATION_MAX = (Validate.OptimalStartDeviation.options?.max as number) ?? 5;
const EARLIEST_START_MIN = (Validate.EarliestStart.options?.min as number) ?? 30;
const EARLIEST_START_MAX = (Validate.EarliestStart.options?.max as number) ?? 300;
const LATEST_START_MIN = (Validate.LatestStart.options?.min as number) ?? 15;
const LATEST_START_MAX = (Validate.LatestStart.options?.max as number) ?? 120;
const HEAT_PUMP_LOCKOUT_MIN = (Validate.HeatPumpLockout.options?.min as number) ?? 0;
const HEAT_PUMP_LOCKOUT_MAX = (Validate.HeatPumpLockout.options?.max as number) ?? 50;
const ECONOMIZER_SETPOINT_MIN = (Validate.EconomizerSetpoint.options?.min as number) ?? 50;
const ECONOMIZER_SETPOINT_MAX = (Validate.EconomizerSetpoint.options?.max as number) ?? 80;
const COOLING_LOCKOUT_MIN = (Validate.CoolingLockout.options?.min as number) ?? 40;
const COOLING_LOCKOUT_MAX = (Validate.CoolingLockout.options?.max as number) ?? 70;
const COOLING_PEAK_OFFSET_MIN = (Validate.CoolingPeakOffset.options?.min as number) ?? 0;
const COOLING_PEAK_OFFSET_MAX = (Validate.CoolingPeakOffset.options?.max as number) ?? 10;
const HEATING_PEAK_OFFSET_MIN = (Validate.HeatingPeakOffset.options?.min as number) ?? 0;
const HEATING_PEAK_OFFSET_MAX = (Validate.HeatingPeakOffset.options?.max as number) ?? 10;
const COOLING_CAPACITY_MIN = (Validate.CoolingCapacity.options?.min as number) ?? 1;
const COOLING_CAPACITY_MAX = (Validate.CoolingCapacity.options?.max as number) ?? 100;
const COMPRESSORS_MIN = (Validate.Compressors.options?.min as number) ?? 1;
const COMPRESSORS_MAX = (Validate.Compressors.options?.max as number) ?? 10;
const HEAT_PUMP_BACKUP_MIN = (Validate.HeatPumpBackup.options?.min as number) ?? 0;
const HEAT_PUMP_BACKUP_MAX = (Validate.HeatPumpBackup.options?.max as number) ?? 500;

// Helper function to get zone options by type
const getZoneOptions = (type: string) => Zone.values.filter((z) => z.type === type);

// Zone type options from @local/common library
const ZoneLocationOptions = getZoneOptions("location");
const ZoneMassOptions = getZoneOptions("mass");
const ZoneOrientationOptions = getZoneOptions("orientation");
const ZoneBuildingOptions = getZoneOptions("building");

type UnitType = NonNullable<ReadUnitQuery["readUnit"]>;

interface UnitProps {
  unit: UnitType | null;
  editing: DeepPartial<UnitType> | null;
  setEditing?: (editing: DeepPartial<UnitType> | null) => void;
  readOnly?: boolean;
  hidden?: string[];
}

export function Unit({ unit, editing, setEditing, readOnly = false, hidden = [] }: UnitProps) {
  const value = merge({}, unit, editing);
  const {
    label,
    peakLoadExclude,
    coolingPeakOffset,
    heatingPeakOffset,
    zoneLocation,
    zoneMass,
    zoneOrientation,
    zoneBuilding,
    coolingCapacity,
    compressors,
    heatPump,
    heatPumpBackup,
    heatPumpLockout,
    economizer,
    economizerSetpoint,
    coolingLockout,
    optimalStartLockout,
    optimalStartDeviation,
    earliestStart,
    latestStart,
  } = value;

  const isFieldHidden = (fieldName: string) => hidden.includes(fieldName);

  return (
    <div style={{ padding: "1rem" }}>
      <FormGroup label="Unit Label">
        <InputGroup
          type="text"
          value={label ?? ""}
          onChange={(e) => {
            const clone = cloneDeep(editing ?? {});
            clone.label = e.target.value;
            setEditing?.(clone);
          }}
          readOnly={readOnly}
          placeholder="Enter unit label"
        />
      </FormGroup>

      <Location unit={unit} editing={editing} setEditing={setEditing} readOnly={readOnly} />

      {!isFieldHidden("peakLoadExclude") && (
        <div className="row">
          <div className="select">
            <Label>
              <b>Participate in Grid Services</b>
              <Popover
                content={
                  <Menu>
                    <MenuItem
                      text="Yes"
                      onClick={() => {
                        const clone = cloneDeep(editing ?? {});
                        clone.peakLoadExclude = false;
                        setEditing?.(clone);
                      }}
                    />
                    <MenuItem
                      text="No"
                      onClick={() => {
                        const clone = cloneDeep(editing ?? {});
                        clone.peakLoadExclude = true;
                        setEditing?.(clone);
                      }}
                    />
                  </Menu>
                }
                placement="bottom-start"
                disabled={readOnly}
              >
                <Button rightIcon={IconNames.CARET_DOWN} minimal disabled={readOnly}>
                  {peakLoadExclude ? "No" : "Yes"}
                </Button>
              </Popover>
            </Label>
          </div>
          <div />
          <div />
        </div>
      )}

      {!isFieldHidden("coolingPeakOffset") && (
        <div className="row">
          <div className="unit">
            <Label>
              <b>Cooling Offset During Grid Services</b>
              <MultiSlider
                min={COOLING_PEAK_OFFSET_MIN}
                max={COOLING_PEAK_OFFSET_MAX}
                stepSize={0.5}
                labelStepSize={1}
                labelRenderer={(v, o) =>
                  o?.isHandleTooltip || (v > COOLING_PEAK_OFFSET_MIN && v < COOLING_PEAK_OFFSET_MAX) ? `${v}º\xa0F` : ""
                }
                disabled={readOnly || !!peakLoadExclude}
              >
                <MultiSlider.Handle
                  type={HandleType.FULL}
                  interactionKind={HandleInteractionKind.LOCK}
                  value={coolingPeakOffset ?? 2}
                  onChange={(v) => {
                    const clone = cloneDeep(editing ?? {});
                    clone.coolingPeakOffset = v;
                    setEditing?.(clone);
                  }}
                />
              </MultiSlider>
            </Label>
          </div>
          <div />
          <div />
        </div>
      )}

      {!isFieldHidden("heatingPeakOffset") && (
        <div className="row">
          <div className="unit">
            <Label>
              <b>Heating Offset During Grid Services</b>
              <MultiSlider
                min={HEATING_PEAK_OFFSET_MIN}
                max={HEATING_PEAK_OFFSET_MAX}
                stepSize={0.5}
                labelStepSize={1}
                labelRenderer={(v, o) =>
                  o?.isHandleTooltip || (v > HEATING_PEAK_OFFSET_MIN && v < HEATING_PEAK_OFFSET_MAX) ? `${v}º\xa0F` : ""
                }
                disabled={readOnly || !!peakLoadExclude}
              >
                <MultiSlider.Handle
                  type={HandleType.FULL}
                  interactionKind={HandleInteractionKind.LOCK}
                  value={heatingPeakOffset ?? 2}
                  onChange={(v) => {
                    const clone = cloneDeep(editing ?? {});
                    clone.heatingPeakOffset = v;
                    setEditing?.(clone);
                  }}
                />
              </MultiSlider>
            </Label>
          </div>
          <div />
          <div />
        </div>
      )}

      <div className="row">
        <div className="select">
          <Label>
            <b>Zone Location</b>
            <Popover
              content={
                <Menu>
                  <MenuItem
                    text="Select zone location..."
                    onClick={() => {
                      const clone = cloneDeep(editing ?? {});
                      clone.zoneLocation = "";
                      setEditing?.(clone);
                    }}
                  />
                  {ZoneLocationOptions.map((option) => (
                    <MenuItem
                      key={option.label}
                      text={option.label}
                      onClick={() => {
                        const clone = cloneDeep(editing ?? {});
                        clone.zoneLocation = option.name;
                        setEditing?.(clone);
                      }}
                    />
                  ))}
                </Menu>
              }
              placement="bottom-start"
              disabled={readOnly}
            >
              <Button rightIcon={IconNames.CARET_DOWN} minimal disabled={readOnly}>
                {ZoneLocationOptions.find((opt) => opt.name === zoneLocation)?.label || "Select zone location..."}
              </Button>
            </Popover>
          </Label>
        </div>
        <div />
        <div />
      </div>

      <div className="row">
        <div className="select">
          <Label>
            <b>Zone Mass</b>
            <Popover
              content={
                <Menu>
                  <MenuItem
                    text="Select zone mass..."
                    onClick={() => {
                      const clone = cloneDeep(editing ?? {});
                      clone.zoneMass = "";
                      setEditing?.(clone);
                    }}
                  />
                  {ZoneMassOptions.map((option) => (
                    <MenuItem
                      key={option.label}
                      text={option.label}
                      onClick={() => {
                        const clone = cloneDeep(editing ?? {});
                        clone.zoneMass = option.name;
                        setEditing?.(clone);
                      }}
                    />
                  ))}
                </Menu>
              }
              placement="bottom-start"
              disabled={readOnly}
            >
              <Button rightIcon={IconNames.CARET_DOWN} minimal disabled={readOnly}>
                {ZoneMassOptions.find((opt) => opt.name === zoneMass)?.label || "Select zone mass..."}
              </Button>
            </Popover>
          </Label>
        </div>
        <div />
        <div />
      </div>

      <div className="row">
        <div className="select">
          <Label>
            <b>Zone Orientation</b>
            <Popover
              content={
                <Menu>
                  <MenuItem
                    text="Select zone orientation..."
                    onClick={() => {
                      const clone = cloneDeep(editing ?? {});
                      clone.zoneOrientation = "";
                      setEditing?.(clone);
                    }}
                  />
                  {ZoneOrientationOptions.map((option) => (
                    <MenuItem
                      key={option.label}
                      text={option.label}
                      onClick={() => {
                        const clone = cloneDeep(editing ?? {});
                        clone.zoneOrientation = option.name;
                        setEditing?.(clone);
                      }}
                    />
                  ))}
                </Menu>
              }
              placement="bottom-start"
              disabled={readOnly}
            >
              <Button rightIcon={IconNames.CARET_DOWN} minimal disabled={readOnly}>
                {ZoneOrientationOptions.find((opt) => opt.name === zoneOrientation)?.label ||
                  "Select zone orientation..."}
              </Button>
            </Popover>
          </Label>
        </div>
        <div />
        <div />
      </div>

      <div className="row">
        <div className="select">
          <Label>
            <b>Zone Type</b>
            <Popover
              content={
                <Menu>
                  <MenuItem
                    text="Select zone type..."
                    onClick={() => {
                      const clone = cloneDeep(editing ?? {});
                      clone.zoneBuilding = "";
                      setEditing?.(clone);
                    }}
                  />
                  {ZoneBuildingOptions.map((option) => (
                    <MenuItem
                      key={option.label}
                      text={option.label}
                      onClick={() => {
                        const clone = cloneDeep(editing ?? {});
                        clone.zoneBuilding = option.name;
                        setEditing?.(clone);
                      }}
                    />
                  ))}
                </Menu>
              }
              placement="bottom-start"
              disabled={readOnly}
            >
              <Button rightIcon={IconNames.CARET_DOWN} minimal disabled={readOnly}>
                {ZoneBuildingOptions.find((opt) => opt.name === zoneBuilding)?.label || "Select zone type..."}
              </Button>
            </Popover>
          </Label>
        </div>
        <div />
        <div />
      </div>

      <div className="row">
        <div className="unit">
          <Label>
            <b>Rated Cooling Capacity</b>
            <NumericInput
              step={0.5}
              min={COOLING_CAPACITY_MIN}
              max={COOLING_CAPACITY_MAX}
              value={coolingCapacity ?? 0}
              onValueChange={(v) => {
                if (typeof v === "number" && !isNaN(v)) {
                  const clone = cloneDeep(editing ?? {});
                  clone.coolingCapacity = v;
                  setEditing?.(clone);
                }
              }}
              rightElement={<Tag minimal>tons</Tag>}
              clampValueOnBlur
              disabled={readOnly}
              intent={
                (coolingCapacity ?? 0) < COOLING_CAPACITY_MIN || (coolingCapacity ?? 0) > COOLING_CAPACITY_MAX
                  ? Intent.DANGER
                  : Intent.NONE
              }
            />
          </Label>
        </div>
        <div />
        <div />
      </div>

      <div className="row">
        <div className="unit">
          <Label>
            <b>Number of Compressors</b>
            <NumericInput
              step={1}
              min={COMPRESSORS_MIN}
              max={COMPRESSORS_MAX}
              value={compressors ?? 0}
              onValueChange={(v) => {
                if (typeof v === "number" && !isNaN(v)) {
                  const clone = cloneDeep(editing ?? {});
                  clone.compressors = v;
                  setEditing?.(clone);
                }
              }}
              clampValueOnBlur
              disabled={readOnly}
              intent={
                (compressors ?? 0) < COMPRESSORS_MIN || (compressors ?? 0) > COMPRESSORS_MAX
                  ? Intent.DANGER
                  : Intent.NONE
              }
            />
          </Label>
        </div>
        <div />
        <div />
      </div>

      {!isFieldHidden("optimalStartLockout") && (
        <div className="row">
          <div className="unit">
            <Label>
              <b>Disable Optimal Start when Outdoor Temperatures are below</b>
              <MultiSlider
                min={OPTIMAL_START_LOCKOUT_MIN}
                max={OPTIMAL_START_LOCKOUT_MAX}
                stepSize={0.5}
                labelStepSize={5}
                labelRenderer={(v, o) =>
                  o?.isHandleTooltip || (v > OPTIMAL_START_LOCKOUT_MIN && v < OPTIMAL_START_LOCKOUT_MAX)
                    ? `${v}º\xa0F`
                    : ""
                }
                disabled={readOnly}
              >
                <MultiSlider.Handle
                  type={HandleType.FULL}
                  interactionKind={HandleInteractionKind.LOCK}
                  value={optimalStartLockout ?? 35}
                  onChange={(v) => {
                    const clone = cloneDeep(editing ?? {});
                    clone.optimalStartLockout = v;
                    setEditing?.(clone);
                  }}
                />
              </MultiSlider>
            </Label>
          </div>
          <div />
          <div />
        </div>
      )}

      {!isFieldHidden("optimalStartDeviation") && (
        <div className="row">
          <div className="unit">
            <Label>
              <b>Optimal Start Allowable Zone Temperature Deviation</b>
              <MultiSlider
                min={OPTIMAL_START_DEVIATION_MIN}
                max={OPTIMAL_START_DEVIATION_MAX}
                stepSize={0.5}
                labelStepSize={0.5}
                labelRenderer={(v, o) =>
                  o?.isHandleTooltip || (v > OPTIMAL_START_DEVIATION_MIN && v < OPTIMAL_START_DEVIATION_MAX)
                    ? `${v}º\xa0F`
                    : ""
                }
                disabled={readOnly}
              >
                <MultiSlider.Handle
                  type={HandleType.FULL}
                  interactionKind={HandleInteractionKind.LOCK}
                  value={optimalStartDeviation ?? 2}
                  onChange={(v) => {
                    const clone = cloneDeep(editing ?? {});
                    clone.optimalStartDeviation = v;
                    setEditing?.(clone);
                  }}
                />
              </MultiSlider>
            </Label>
          </div>
          <div />
          <div />
        </div>
      )}

      {!isFieldHidden("earliestStart") && (
        <div className="row">
          <div className="unit">
            <Label>
              <b>Earliest Start Time Before Occupancy</b>
              <MultiSlider
                min={EARLIEST_START_MIN}
                max={EARLIEST_START_MAX}
                stepSize={5}
                labelStepSize={30}
                labelRenderer={(v, o) =>
                  o?.isHandleTooltip || (v > EARLIEST_START_MIN && v < EARLIEST_START_MAX) ? `${v}\xa0min` : ""
                }
                disabled={readOnly}
              >
                <MultiSlider.Handle
                  type={HandleType.FULL}
                  interactionKind={HandleInteractionKind.LOCK}
                  value={earliestStart ?? 120}
                  onChange={(v) => {
                    const clone = cloneDeep(editing ?? {});
                    clone.earliestStart = v;
                    setEditing?.(clone);
                  }}
                />
              </MultiSlider>
            </Label>
          </div>
          <div />
          <div />
        </div>
      )}

      {!isFieldHidden("latestStart") && (
        <div className="row">
          <div className="unit">
            <Label>
              <b>Latest Start Time Before Occupancy</b>
              <MultiSlider
                min={LATEST_START_MIN}
                max={LATEST_START_MAX}
                stepSize={5}
                labelStepSize={15}
                labelRenderer={(v, o) =>
                  o?.isHandleTooltip || (v > LATEST_START_MIN && v < LATEST_START_MAX) ? `${v}\xa0min` : ""
                }
                disabled={readOnly}
              >
                <MultiSlider.Handle
                  type={HandleType.FULL}
                  interactionKind={HandleInteractionKind.LOCK}
                  value={latestStart ?? 30}
                  onChange={(v) => {
                    const clone = cloneDeep(editing ?? {});
                    clone.latestStart = v;
                    setEditing?.(clone);
                  }}
                />
              </MultiSlider>
            </Label>
          </div>
          <div />
          <div />
        </div>
      )}

      <div className="row">
        <div className="select">
          <Label>
            <b>Heat Pump</b>
            <Popover
              content={
                <Menu>
                  <MenuItem
                    text="Yes"
                    onClick={() => {
                      const clone = cloneDeep(editing ?? {});
                      clone.heatPump = true;
                      setEditing?.(clone);
                    }}
                  />
                  <MenuItem
                    text="No"
                    onClick={() => {
                      const clone = cloneDeep(editing ?? {});
                      clone.heatPump = false;
                      setEditing?.(clone);
                    }}
                  />
                </Menu>
              }
              placement="bottom-start"
              disabled={readOnly}
            >
              <Button rightIcon={IconNames.CARET_DOWN} minimal disabled={readOnly}>
                {heatPump ? "Yes" : "No"}
              </Button>
            </Popover>
          </Label>
        </div>
        <div />
        <div />
      </div>

      {heatPump && (
        <div className="row">
          <div className="unit">
            <Label>
              <b>Heat Pump Electric Backup Capacity</b>
              <NumericInput
                step={0.5}
                min={HEAT_PUMP_BACKUP_MIN}
                max={HEAT_PUMP_BACKUP_MAX}
                value={heatPumpBackup ?? 0}
                onValueChange={(v) => {
                  if (typeof v === "number" && !isNaN(v)) {
                    const clone = cloneDeep(editing ?? {});
                    clone.heatPumpBackup = v;
                    setEditing?.(clone);
                  }
                }}
                rightElement={<Tag minimal>kW</Tag>}
                clampValueOnBlur
                disabled={readOnly}
                intent={
                  (heatPumpBackup ?? 0) < HEAT_PUMP_BACKUP_MIN || (heatPumpBackup ?? 0) > HEAT_PUMP_BACKUP_MAX
                    ? Intent.DANGER
                    : Intent.NONE
                }
              />
            </Label>
          </div>
          <div />
          <div />
        </div>
      )}

      {heatPump && !isFieldHidden("heatPumpLockout") && (
        <div className="row">
          <div className="unit">
            <Label>
              <b>Heat Pump Auxiliary Heat Lockout</b>
              <MultiSlider
                min={HEAT_PUMP_LOCKOUT_MIN}
                max={HEAT_PUMP_LOCKOUT_MAX}
                stepSize={0.5}
                labelStepSize={8}
                labelRenderer={(v, o) =>
                  o?.isHandleTooltip || (v > HEAT_PUMP_LOCKOUT_MIN && v < HEAT_PUMP_LOCKOUT_MAX) ? `${v}º\xa0F` : ""
                }
                disabled={readOnly}
              >
                <MultiSlider.Handle
                  type={HandleType.FULL}
                  interactionKind={HandleInteractionKind.LOCK}
                  value={heatPumpLockout ?? 25}
                  onChange={(v) => {
                    const clone = cloneDeep(editing ?? {});
                    clone.heatPumpLockout = v;
                    setEditing?.(clone);
                  }}
                />
              </MultiSlider>
            </Label>
          </div>
          <div />
          <div />
        </div>
      )}

      {!isFieldHidden("economizer") && (
        <div className="row">
          <div className="select">
            <Label>
              <b>Economizer</b>
              <Popover
                content={
                  <Menu>
                    <MenuItem
                      text="Yes"
                      onClick={() => {
                        const clone = cloneDeep(editing ?? {});
                        clone.economizer = true;
                        setEditing?.(clone);
                      }}
                    />
                    <MenuItem
                      text="No"
                      onClick={() => {
                        const clone = cloneDeep(editing ?? {});
                        clone.economizer = false;
                        setEditing?.(clone);
                      }}
                    />
                  </Menu>
                }
                placement="bottom-start"
                disabled={readOnly}
              >
                <Button rightIcon={IconNames.CARET_DOWN} minimal disabled={readOnly}>
                  {economizer ? "Yes" : "No"}
                </Button>
              </Popover>
            </Label>
          </div>
          <div />
          <div />
        </div>
      )}

      {economizer && !isFieldHidden("economizerSetpoint") && (
        <div className="row">
          <div className="unit">
            <Label>
              <b>Economizer Switchover Temperature Setpoint</b>
              <MultiSlider
                min={ECONOMIZER_SETPOINT_MIN}
                max={ECONOMIZER_SETPOINT_MAX}
                stepSize={0.5}
                labelStepSize={5}
                labelRenderer={(v, o) =>
                  o?.isHandleTooltip || (v > ECONOMIZER_SETPOINT_MIN && v < ECONOMIZER_SETPOINT_MAX) ? `${v}º\xa0F` : ""
                }
                disabled={readOnly}
              >
                <MultiSlider.Handle
                  type={HandleType.FULL}
                  interactionKind={HandleInteractionKind.LOCK}
                  value={economizerSetpoint ?? 65}
                  onChange={(v) => {
                    const clone = cloneDeep(editing ?? {});
                    clone.economizerSetpoint = v;
                    setEditing?.(clone);
                  }}
                />
              </MultiSlider>
            </Label>
          </div>
          <div />
          <div />
        </div>
      )}

      {economizer && !isFieldHidden("coolingLockout") && (
        <div className="row">
          <div className="unit">
            <Label>
              <b>Compressor Cooling Lockout Temperature</b>
              <MultiSlider
                min={COOLING_LOCKOUT_MIN}
                max={COOLING_LOCKOUT_MAX}
                stepSize={0.5}
                labelStepSize={5}
                labelRenderer={(v, o) =>
                  o?.isHandleTooltip || (v > COOLING_LOCKOUT_MIN && v < COOLING_LOCKOUT_MAX) ? `${v}º\xa0F` : ""
                }
                disabled={readOnly}
              >
                <MultiSlider.Handle
                  type={HandleType.FULL}
                  interactionKind={HandleInteractionKind.LOCK}
                  value={coolingLockout ?? 55}
                  onChange={(v) => {
                    const clone = cloneDeep(editing ?? {});
                    clone.coolingLockout = v;
                    setEditing?.(clone);
                  }}
                />
              </MultiSlider>
            </Label>
          </div>
          <div />
          <div />
        </div>
      )}

      <div
        style={{
          marginTop: "1rem",
          padding: "0.5rem",
          backgroundColor: "var(--bp5-background-color-secondary)",
          borderRadius: "4px",
        }}
      >
        <small style={{ color: "var(--bp5-text-color-muted)" }}>
          <strong>Note:</strong> ILC configuration settings affect system performance, energy efficiency, and grid
          service participation. Consult with HVAC professionals when making significant changes to these parameters.
        </small>
      </div>
    </div>
  );
}
