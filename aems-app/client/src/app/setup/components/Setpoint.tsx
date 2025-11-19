import {
  InputGroup,
  Label,
  NumericInput,
  FormGroup,
  MultiSlider,
  HandleType,
  HandleInteractionKind,
  Intent,
} from "@blueprintjs/core";
import { useMemo, useState } from "react";
import { merge, clamp, cloneDeep } from "lodash";
import {
  SETPOINT_MIN,
  SETPOINT_MAX,
  SETPOINT_PADDING,
  DEADBAND_MIN,
  DEADBAND_MAX,
  HEATING_MIN,
  COOLING_MAX,
  STANDBY_TIME_MIN,
  STANDBY_TIME_MAX,
  STANDBY_OFFSET_MIN,
  STANDBY_OFFSET_MAX,
  createSetpointLabel,
  getSetpointMessage,
  SETPOINT_DEFAULT,
  DEADBAND_DEFAULT,
  HEATING_DEFAULT,
  COOLING_DEFAULT,
  STANDBY_TIME_DEFAULT,
  STANDBY_OFFSET_DEFAULT,
} from "@/utils/setpoint";
import { DeepPartial } from "@local/common";
import { ReadUnitQuery } from "@/graphql-codegen/graphql";

type UnitType = NonNullable<ReadUnitQuery["readUnit"]>;

interface SetpointProps {
  unit: UnitType | null;
  editing: DeepPartial<UnitType> | null;
  setEditing?: (editing: DeepPartial<UnitType> | null) => void;
  readOnly?: boolean;
}

export function Setpoint({ unit, editing, setEditing, readOnly = false }: SetpointProps) {
  const merged = merge(
    {
      label: createSetpointLabel("all", {
        setpoint: SETPOINT_DEFAULT,
        deadband: DEADBAND_DEFAULT,
        heating: HEATING_DEFAULT,
        cooling: COOLING_DEFAULT,
        standbyTime: STANDBY_TIME_DEFAULT,
        standbyOffset: STANDBY_OFFSET_DEFAULT,
      }),
      setpoint: SETPOINT_DEFAULT,
      deadband: DEADBAND_DEFAULT,
      heating: HEATING_DEFAULT,
      cooling: COOLING_DEFAULT,
      standbyTime: STANDBY_TIME_DEFAULT,
      standbyOffset: STANDBY_OFFSET_DEFAULT,
    },
    unit?.configuration?.setpoint,
    editing?.configuration?.setpoint,
  );
  const { label, setpoint, deadband, heating, cooling, standbyTime, standbyOffset } = merged;
  const occupancyDetection = editing?.occupancyDetection ?? unit?.occupancyDetection ?? false;
  const padding = SETPOINT_PADDING + deadband / 2;

  const [standby, setStandby] = useState(standbyOffset.toString());

  const error = useMemo(() => getSetpointMessage(merged) || "\u00A0", [merged]);

  const renderSeparateSliders = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Label>
        <b>Occupied Setpoint Range</b>
        <MultiSlider
          min={SETPOINT_MIN}
          max={SETPOINT_MAX}
          stepSize={0.5}
          labelStepSize={5}
          intent={Intent.SUCCESS}
          labelRenderer={(v, o) => (o?.isHandleTooltip || (v > HEATING_MIN && v < COOLING_MAX) ? `${v}º\xa0F` : "")}
        >
          <MultiSlider.Handle
            type={HandleType.START}
            interactionKind={HandleInteractionKind.LOCK}
            intentBefore={Intent.WARNING}
            intentAfter={Intent.SUCCESS}
            value={setpoint - deadband / 2}
            onChange={(v) => {
              const value = v + deadband / 2;
              const setpoint = clamp(value, heating + padding, cooling - padding);
              const standbyOffsetNew = clamp(
                standbyOffset,
                STANDBY_OFFSET_MIN,
                Math.min(STANDBY_OFFSET_MAX, setpoint - deadband / 2 - heating, cooling - (setpoint + deadband / 2)),
              );
              if (standbyOffsetNew !== standbyOffset) {
                setStandby(standbyOffsetNew.toString());
              }
              const label = createSetpointLabel("all", {
                setpoint,
                deadband,
                heating,
                cooling,
                standbyTime,
                standbyOffset: standbyOffsetNew,
              });
              const clone = cloneDeep(editing ?? {});
              clone.configuration = clone.configuration ?? {};
              clone.configuration.setpoint = clone.configuration?.setpoint ?? {};
              clone.configuration.setpoint.setpoint = setpoint;
              clone.configuration.setpoint.standbyOffset = standbyOffsetNew;
              clone.configuration.setpoint.label = label;
              setEditing?.(clone);
            }}
          />
          <MultiSlider.Handle
            type={HandleType.END}
            interactionKind={HandleInteractionKind.LOCK}
            intentBefore={Intent.SUCCESS}
            intentAfter={Intent.PRIMARY}
            value={setpoint + deadband / 2}
            onChange={(v) => {
              const value = v - deadband / 2;
              const setpoint = clamp(value, heating + padding, cooling - padding);
              const standbyOffsetNew = clamp(
                standbyOffset,
                STANDBY_OFFSET_MIN,
                Math.min(STANDBY_OFFSET_MAX, setpoint - deadband / 2 - heating, cooling - (setpoint + deadband / 2)),
              );
              if (standbyOffsetNew !== standbyOffset) {
                setStandby(standbyOffsetNew.toString());
              }
              const label = createSetpointLabel("all", {
                setpoint,
                deadband,
                heating,
                cooling,
                standbyTime,
                standbyOffset: standbyOffsetNew,
              });
              const clone = cloneDeep(editing ?? {});
              clone.configuration = clone.configuration ?? {};
              clone.configuration.setpoint = clone.configuration?.setpoint ?? {};
              clone.configuration.setpoint.setpoint = setpoint;
              clone.configuration.setpoint.standbyOffset = standbyOffsetNew;
              clone.configuration.setpoint.label = label;
              setEditing?.(clone);
            }}
          />
        </MultiSlider>
      </Label>

      <Label>
        <b>Unoccupied Temperature Limits</b>
        <MultiSlider
          min={SETPOINT_MIN}
          max={SETPOINT_MAX}
          stepSize={0.5}
          labelStepSize={5}
          labelRenderer={(v, o) => (o?.isHandleTooltip || (v > HEATING_MIN && v < COOLING_MAX) ? `${v}º\xa0F` : "")}
        >
          <MultiSlider.Handle
            type={HandleType.START}
            interactionKind={HandleInteractionKind.LOCK}
            intentBefore={Intent.WARNING}
            value={heating}
            onChange={(v) => {
              const heating = clamp(v, HEATING_MIN, setpoint - padding);
              const standbyOffsetNew = clamp(
                standbyOffset,
                STANDBY_OFFSET_MIN,
                Math.min(STANDBY_OFFSET_MAX, setpoint - deadband / 2 - heating, cooling - (setpoint + deadband / 2)),
              );
              if (standbyOffsetNew !== standbyOffset) {
                setStandby(standbyOffsetNew.toString());
              }
              const label = createSetpointLabel("all", {
                setpoint,
                deadband,
                heating,
                cooling,
                standbyTime,
                standbyOffset: standbyOffsetNew,
              });
              const clone = cloneDeep(editing ?? {});
              clone.configuration = clone.configuration ?? {};
              clone.configuration.setpoint = clone.configuration?.setpoint ?? {};
              clone.configuration.setpoint.heating = heating;
              clone.configuration.setpoint.standbyOffset = standbyOffsetNew;
              clone.configuration.setpoint.label = label;
              setEditing?.(clone);
            }}
          />
          <MultiSlider.Handle
            type={HandleType.END}
            interactionKind={HandleInteractionKind.LOCK}
            intentAfter={Intent.PRIMARY}
            value={cooling}
            onChange={(v) => {
              const cooling = clamp(v, setpoint + padding, COOLING_MAX);
              const standbyOffsetNew = clamp(
                standbyOffset,
                STANDBY_OFFSET_MIN,
                Math.min(STANDBY_OFFSET_MAX, setpoint - deadband / 2 - heating, cooling - (setpoint + deadband / 2)),
              );
              if (standbyOffsetNew !== standbyOffset) {
                setStandby(standbyOffsetNew.toString());
              }
              const label = createSetpointLabel("all", {
                setpoint,
                deadband,
                heating,
                cooling,
                standbyTime,
                standbyOffset: standbyOffsetNew,
              });
              const clone = cloneDeep(editing ?? {});
              clone.configuration = clone.configuration ?? {};
              clone.configuration.setpoint = clone.configuration?.setpoint ?? {};
              clone.configuration.setpoint.cooling = cooling;
              clone.configuration.setpoint.standbyOffset = standbyOffsetNew;
              clone.configuration.setpoint.label = label;
              setEditing?.(clone);
            }}
          />
        </MultiSlider>
      </Label>
    </div>
  );

  return (
    <div style={{ padding: "1rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gap: "1rem",
          alignItems: "end",
          marginBottom: "1rem",
        }}
      >
        <FormGroup label="Setpoint Label">
          <InputGroup
            type="text"
            value={label ?? ""}
            onChange={(e) => {
              const clone = cloneDeep(editing ?? {});
              clone.configuration = clone.configuration ?? {};
              clone.configuration.setpoint = clone.configuration?.setpoint ?? {};
              clone.configuration.setpoint.label = e.target.value;
              setEditing?.(clone);
            }}
            readOnly={readOnly}
            placeholder="Enter setpoint label"
          />
        </FormGroup>

        <FormGroup label="Deadband (°F)">
          <NumericInput
            allowNumericCharactersOnly
            step={1}
            min={DEADBAND_MIN}
            max={DEADBAND_MAX}
            value={deadband}
            onValueChange={(v) => {
              const deadband = clamp(v, DEADBAND_MIN, DEADBAND_MAX);
              const heatingNew = clamp(heating, HEATING_MIN, setpoint - padding - deadband / 2);
              const coolingNew = clamp(cooling, setpoint + padding + deadband / 2, COOLING_MAX);
              const standbyOffsetNew = clamp(
                standbyOffset,
                STANDBY_OFFSET_MIN,
                Math.min(
                  STANDBY_OFFSET_MAX,
                  setpoint - deadband / 2 - heatingNew,
                  coolingNew - (setpoint + deadband / 2),
                ),
              );
              if (standbyOffsetNew !== standbyOffset) {
                setStandby(standbyOffsetNew.toString());
              }
              const label = createSetpointLabel("all", {
                setpoint,
                deadband,
                heating: heatingNew,
                cooling: coolingNew,
                standbyTime,
                standbyOffset: standbyOffsetNew,
              });
              const clone = cloneDeep(editing ?? {});
              clone.configuration = clone.configuration ?? {};
              clone.configuration.setpoint = clone.configuration?.setpoint ?? {};
              clone.configuration.setpoint.deadband = deadband;
              clone.configuration.setpoint.heating = heatingNew;
              clone.configuration.setpoint.cooling = coolingNew;
              clone.configuration.setpoint.standbyOffset = standbyOffsetNew;
              clone.configuration.setpoint.label = label;
              setEditing?.(clone);
            }}
            disabled={readOnly}
            fill
          />
        </FormGroup>

        <div style={{ color: "var(--bp5-intent-danger)", fontSize: "0.875rem", fontWeight: "bold" }}>{error}</div>
      </div>

      {renderSeparateSliders()}

      {occupancyDetection && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            alignItems: "end",
            marginBottom: "1rem",
          }}
        >
          <FormGroup label="Standby Time (minutes)">
            <NumericInput
              step={1}
              min={STANDBY_TIME_MIN}
              max={STANDBY_TIME_MAX}
              value={standbyTime}
              onValueChange={(v) => {
                const label = createSetpointLabel("all", {
                  setpoint,
                  deadband,
                  heating,
                  cooling,
                  standbyTime: v,
                  standbyOffset,
                });
                const clone = cloneDeep(editing ?? {});
                clone.configuration = clone.configuration ?? {};
                clone.configuration.setpoint = clone.configuration?.setpoint ?? {};
                clone.configuration.setpoint.standbyTime = v;
                clone.configuration.setpoint.label = label;
                setEditing?.(clone);
              }}
              disabled={readOnly}
              fill
            />
          </FormGroup>

          <FormGroup label="Standby Temperature Offset (°F)">
            <NumericInput
              allowNumericCharactersOnly
              step={1}
              min={STANDBY_OFFSET_MIN}
              max={STANDBY_OFFSET_MAX}
              value={standby}
              onValueChange={(v, s) => {
                if (v.toString() !== s) {
                  setStandby(s);
                  return;
                }
                const standbyOffset = clamp(
                  v,
                  STANDBY_OFFSET_MIN,
                  Math.min(STANDBY_OFFSET_MAX, setpoint - deadband / 2 - heating, cooling - (setpoint + deadband / 2)),
                );
                setStandby(standbyOffset.toString());
                const label = createSetpointLabel("all", {
                  setpoint,
                  deadband,
                  heating,
                  cooling,
                  standbyTime,
                  standbyOffset,
                });
                const clone = cloneDeep(editing ?? {});
                clone.configuration = clone.configuration ?? {};
                clone.configuration.setpoint = clone.configuration?.setpoint ?? {};
                clone.configuration.setpoint.standbyOffset = standbyOffset;
                clone.configuration.setpoint.label = label;
                setEditing?.(clone);
              }}
              disabled={readOnly}
              fill
            />
          </FormGroup>
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
          <strong>Note:</strong> The occupied setpoint range (green) shows the comfort zone during occupied hours.
          Unoccupied limits (orange/blue) define energy-saving temperatures when the space is empty. The deadband
          prevents frequent switching between heating and cooling. Standby settings are only active if occupancy
          detection is enabled in the unit configuration and the capability is supported by the control system.
        </small>
      </div>
    </div>
  );
}
