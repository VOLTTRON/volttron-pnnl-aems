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
import { useMemo } from "react";
import { merge, clamp, cloneDeep } from "lodash";
import {
  SETPOINT_MIN,
  SETPOINT_MAX,
  SETPOINT_PADDING,
  DEADBAND_MIN,
  DEADBAND_MAX,
  HEATING_MIN,
  COOLING_MAX,
  createSetpointLabel,
  getSetpointMessage,
  SETPOINT_DEFAULT,
  DEADBAND_DEFAULT,
  HEATING_DEFAULT,
  COOLING_DEFAULT,
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
      }),
      setpoint: SETPOINT_DEFAULT,
      deadband: DEADBAND_DEFAULT,
      heating: HEATING_DEFAULT,
      cooling: COOLING_DEFAULT,
    },
    unit?.configuration?.setpoint,
    editing?.configuration?.setpoint,
  );
  const { label, setpoint, deadband, heating, cooling } = merged;
  const padding = SETPOINT_PADDING + deadband / 2;

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
              const label = createSetpointLabel("all", { setpoint, deadband, heating, cooling });
              const clone = cloneDeep(editing ?? {});
              clone.configuration = clone.configuration ?? {};
              clone.configuration.setpoint = clone.configuration?.setpoint ?? {};
              clone.configuration.setpoint.setpoint = setpoint;
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
              const label = createSetpointLabel("all", { setpoint, deadband, heating, cooling });
              const clone = cloneDeep(editing ?? {});
              clone.configuration = clone.configuration ?? {};
              clone.configuration.setpoint = clone.configuration?.setpoint ?? {};
              clone.configuration.setpoint.setpoint = setpoint;
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
              const value = clamp(v, HEATING_MIN, heating - padding);
              const label = createSetpointLabel("all", {
                setpoint,
                deadband,
                heating: value,
                cooling,
              });
              const clone = cloneDeep(editing ?? {});
              clone.configuration = clone.configuration ?? {};
              clone.configuration.setpoint = clone.configuration?.setpoint ?? {};
              clone.configuration.setpoint.heating = value;
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
              const value = clamp(v, cooling + padding, COOLING_MAX);
              const label = createSetpointLabel("all", {
                setpoint,
                deadband,
                heating,
                cooling: value,
              });
              const clone = cloneDeep(editing ?? {});
              clone.configuration = clone.configuration ?? {};
              clone.configuration.setpoint = clone.configuration?.setpoint ?? {};
              clone.configuration.setpoint.cooling = value;
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
        <FormGroup label="Setpoint Configuration">
          <Label>
            <b>Setpoint Label</b>
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
          </Label>
        </FormGroup>

        <FormGroup label="Deadband">
          <Label>
            <b>Deadband (°F)</b>
            <NumericInput
              step={1}
              min={DEADBAND_MIN}
              max={DEADBAND_MAX}
              value={deadband}
              onValueChange={(v) => {
                const label = createSetpointLabel("all", {
                  setpoint,
                  deadband: v,
                  heating,
                  cooling,
                });
                const clone = cloneDeep(editing ?? {});
                clone.configuration = clone.configuration ?? {};
                clone.configuration.setpoint = clone.configuration?.setpoint ?? {};
                clone.configuration.setpoint.deadband = v;
                clone.configuration.setpoint.label = label;
                setEditing?.(clone);
              }}
              disabled={readOnly}
              fill
            />
          </Label>
        </FormGroup>

        <div style={{ color: "var(--bp5-intent-danger)", fontSize: "0.875rem", fontWeight: "bold" }}>{error}</div>
      </div>

      {renderSeparateSliders()}

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
          prevents frequent switching between heating and cooling.
        </small>
      </div>
    </div>
  );
}
