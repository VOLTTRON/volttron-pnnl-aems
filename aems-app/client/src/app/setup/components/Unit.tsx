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
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { cloneDeep, merge } from "lodash";
import { DeepPartial, Validate } from "@local/common";
import { ReadUnitQuery } from "@/graphql-codegen/graphql";
import { Location } from "./Location";

// Constants for validation (matching deprecated version)
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

type UnitType = NonNullable<ReadUnitQuery["readUnit"]>;

interface UnitProps {
  unit: UnitType | null;
  editing: DeepPartial<UnitType> | null;
  setEditing?: (editing: DeepPartial<UnitType> | null) => void;
  readOnly?: boolean;
}

export function Unit({ unit, editing, setEditing, readOnly = false }: UnitProps) {
  const value = merge({}, unit, editing);
  const {
    label,
    heatPumpLockout,
    economizer,
    economizerSetpoint,
    coolingLockout,
    optimalStartLockout,
    optimalStartDeviation,
    earliestStart,
    latestStart,
    heatPump,
  } = value;

  return (
    <div style={{ padding: "1rem" }}>
      <FormGroup label="Unit Information">
        <Label>
          <b>Unit Label</b>
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
        </Label>
      </FormGroup>

      <Location unit={unit} editing={editing} setEditing={setEditing} readOnly={readOnly} />

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
                value={optimalStartLockout || 35}
                onChange={(v) => {
                  const clone = cloneDeep(editing ?? {});
                  clone.optimalStartLockout = v;
                  setEditing?.(clone);
                }}
              />
            </MultiSlider>
          </Label>
        </div>
      </div>

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
                value={optimalStartDeviation || 2}
                onChange={(v) => {
                  const clone = cloneDeep(editing ?? {});
                  clone.optimalStartDeviation = v;
                  setEditing?.(clone);
                }}
              />
            </MultiSlider>
          </Label>
        </div>
      </div>

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
                value={earliestStart || 120}
                onChange={(v) => {
                  const clone = cloneDeep(editing ?? {});
                  clone.earliestStart = v;
                  setEditing?.(clone);
                }}
              />
            </MultiSlider>
          </Label>
        </div>
      </div>

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
                value={latestStart || 30}
                onChange={(v) => {
                  const clone = cloneDeep(editing ?? {});
                  clone.latestStart = v;
                  setEditing?.(clone);
                }}
              />
            </MultiSlider>
          </Label>
        </div>
      </div>

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
      </div>

      {heatPump && (
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
                  value={heatPumpLockout || 25}
                  onChange={(v) => {
                    const clone = cloneDeep(editing ?? {});
                    clone.heatPumpLockout = v;
                    setEditing?.(clone);
                  }}
                />
              </MultiSlider>
            </Label>
          </div>
        </div>
      )}

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
      </div>

      {economizer && (
        <>
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
                    o?.isHandleTooltip || (v > ECONOMIZER_SETPOINT_MIN && v < ECONOMIZER_SETPOINT_MAX)
                      ? `${v}º\xa0F`
                      : ""
                  }
                  disabled={readOnly}
                >
                  <MultiSlider.Handle
                    type={HandleType.FULL}
                    interactionKind={HandleInteractionKind.LOCK}
                    value={economizerSetpoint || 65}
                    onChange={(v) => {
                      const clone = cloneDeep(editing ?? {});
                      clone.economizerSetpoint = v;
                      setEditing?.(clone);
                    }}
                  />
                </MultiSlider>
              </Label>
            </div>
          </div>

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
                    value={coolingLockout || 55}
                    onChange={(v) => {
                      const clone = cloneDeep(editing ?? {});
                      clone.coolingLockout = v;
                      setEditing?.(clone);
                    }}
                  />
                </MultiSlider>
              </Label>
            </div>
          </div>
        </>
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
          <strong>Note:</strong> RTU configuration settings affect system performance and energy efficiency. Consult
          with HVAC professionals when making significant changes to these parameters.
        </small>
      </div>
    </div>
  );
}
