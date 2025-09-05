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
import { useCallback, useMemo } from "react";
import { get, merge, clamp } from "lodash";
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
} from "@/utils/setpoint";
import { Unit } from "@/graphql-codegen/graphql";
import { DeepPartial } from "@local/common";

type UnitType = Unit;

interface SetpointsProps {
  unit: UnitType | null;
  editing: DeepPartial<UnitType> | null;
  handleChange: (
    field: string,
    editingUnit?: DeepPartial<UnitType> | null,
  ) => (value: string | number | boolean | object | null | undefined) => void;
  readOnly?: boolean;
}

export function Setpoints({ unit, editing, handleChange, readOnly = false }: SetpointsProps) {
  const getValue = useCallback(
    (field: string) => {
      return get(editing, field, get(unit, field));
    },
    [editing, unit],
  );

  const path = "configuration.setpoint";
  const setpoint = merge({}, get(unit, path), get(editing, path));

  const error = useMemo(() => getSetpointMessage(setpoint as any) || "\u00A0", [setpoint]);

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
            value={getValue(`${path}.setpoint`) - getValue(`${path}.deadband`) / 2}
            onChange={(v) => {
              const deadband = getValue(`${path}.deadband`);
              const padding = SETPOINT_PADDING + deadband / 2;
              const heating = getValue(`${path}.heating`);
              const cooling = getValue(`${path}.cooling`);
              const value = v + deadband / 2;
              const setpoint = clamp(value, heating + padding, cooling - padding);
              const label = createSetpointLabel("all", { setpoint, deadband, heating, cooling });
              handleChange(`${path}`, editing)({ setpoint, label });
            }}
          />
          <MultiSlider.Handle
            type={HandleType.END}
            interactionKind={HandleInteractionKind.LOCK}
            intentBefore={Intent.SUCCESS}
            intentAfter={Intent.PRIMARY}
            value={getValue(`${path}.setpoint`) + getValue(`${path}.deadband`) / 2}
            onChange={(v) => {
              const deadband = getValue(`${path}.deadband`);
              const padding = SETPOINT_PADDING + deadband / 2;
              const heating = getValue(`${path}.heating`);
              const cooling = getValue(`${path}.cooling`);
              const value = v - deadband / 2;
              const setpoint = clamp(value, heating + padding, cooling - padding);
              const label = createSetpointLabel("all", { setpoint, deadband, heating, cooling });
              handleChange(`${path}`, editing)({ setpoint, label });
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
            value={getValue(`${path}.heating`)}
            onChange={(v) => {
              const setpoint = getValue(`${path}.setpoint`);
              const deadband = getValue(`${path}.deadband`);
              const padding = SETPOINT_PADDING + deadband / 2;
              const heating = clamp(v, HEATING_MIN, setpoint - padding);
              const cooling = getValue(`${path}.cooling`);
              const label = createSetpointLabel("all", { setpoint, deadband, heating, cooling });
              handleChange(`${path}`, editing)({ heating, label });
            }}
          />
          <MultiSlider.Handle
            type={HandleType.END}
            interactionKind={HandleInteractionKind.LOCK}
            intentAfter={Intent.PRIMARY}
            value={getValue(`${path}.cooling`)}
            onChange={(v) => {
              const setpoint = getValue(`${path}.setpoint`);
              const deadband = getValue(`${path}.deadband`);
              const padding = SETPOINT_PADDING + deadband / 2;
              const heating = getValue(`${path}.heating`);
              const cooling = clamp(v, setpoint + padding, COOLING_MAX);
              const label = createSetpointLabel("all", { setpoint, deadband, heating, cooling });
              handleChange(`${path}`, editing)({ cooling, label });
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
              value={getValue(`${path}.label`) || ""}
              onChange={(e) => handleChange(`${path}.label`, editing)(e.target.value)}
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
              value={getValue(`${path}.deadband`) || 4}
              onValueChange={(v) => {
                const setpoint = getValue(`${path}.setpoint`);
                const deadband = v;
                const heating = getValue(`${path}.heating`);
                const cooling = getValue(`${path}.cooling`);
                const label = createSetpointLabel("all", { setpoint, deadband, heating, cooling });
                handleChange(`${path}`, editing)({ deadband, label });
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
