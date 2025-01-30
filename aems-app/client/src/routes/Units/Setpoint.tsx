import {
  COOLING_MAX,
  DEADBAND_MAX,
  DEADBAND_MIN,
  HEATING_MIN,
  SETPOINT_MAX,
  SETPOINT_MIN,
  SETPOINT_PADDING,
  createSetpointLabel,
  getSetpointMessage,
} from "utils/setpoint";
import {
  HandleInteractionKind,
  HandleType,
  InputGroup,
  Intent,
  Label,
  MultiSlider,
  NumericInput,
} from "@blueprintjs/core";
import { clamp, get, merge } from "lodash";
import { useCallback, useMemo } from "react";

import { ISetpoint } from "controllers/setpoints/action";
import { IUnit } from "controllers/units/action";
import { DeepPartial } from "../../utils/types";

export function Setpoint(props: {
  type: "single" | "separate" | "both";
  title: string;
  path: string;
  unit: DeepPartial<IUnit> | IUnit;
  editing: DeepPartial<IUnit> | null;
  setpoint: DeepPartial<ISetpoint> | undefined;
  handleChange: (field: string, unit?: DeepPartial<IUnit> | null) => (value: any) => void;
  readOnly?: Array<"title">;
}) {
  const { type, title, path, unit, editing, setpoint, handleChange, readOnly = ["title"] } = props;

  const getValue = useCallback((field: string) => get(editing, field, get(unit, field)), [editing, unit]);

  const error = useMemo(
    () => getSetpointMessage(merge({}, get(unit, path), setpoint)) || "\u00A0",
    [path, unit, setpoint]
  );

  const renderSingle = () => (
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
        intentAfter={Intent.WARNING}
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
        type={HandleType.START}
        interactionKind={HandleInteractionKind.LOCK}
        intentAfter={Intent.NONE}
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
        intentBefore={Intent.NONE}
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
      <MultiSlider.Handle
        type={HandleType.END}
        interactionKind={HandleInteractionKind.LOCK}
        intentBefore={Intent.PRIMARY}
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
  );

  const renderOccupied = () => (
    <Label>
      <b>Occupied</b>
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
  );

  const renderUnoccupied = () => (
    <Label>
      <b>Unoccupied</b>
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
  );

  const renderSliders = () => {
    switch (type) {
      case "both":
        return (
          <div className="row">
            <div className="setpoint">{renderSingle()}</div>
            <div className="break" />
            <div className="setpoint">{renderOccupied()}</div>
            <div className="break" />
            <div className="setpoint">{renderUnoccupied()}</div>
            <div className="break" />
            <div />
          </div>
        );
      case "single":
        return (
          <div className="row">
            <div className="setpoint">{renderSingle()}</div>
            <div className="break" />
            <div />
          </div>
        );
      case "separate":
      default:
        return (
          <div className="row">
            <div className="setpoint">{renderOccupied()}</div>
            <div className="break" />
            <div className="setpoint">{renderUnoccupied()}</div>
            <div className="break" />
            <div />
          </div>
        );
    }
  };

  return (
    <>
      <div className="row">
        <h3> </h3>
        <div className="label">
          <Label>
            <b>{title}</b>
            <InputGroup
              type="text"
              value={getValue(`${path}.label`)}
              onChange={(e) => {
                handleChange(`${path}.label`, editing)(e.target.value);
              }}
              readOnly={readOnly?.includes("title")}
            />
          </Label>
        </div>
        <div className="deadband">
          <Label>
            <b>Deadband</b>
            <NumericInput
              step={1}
              min={DEADBAND_MIN}
              max={DEADBAND_MAX}
              value={getValue(`${path}.deadband`)}
              onValueChange={(v) => {
                const setpoint = getValue(`${path}.setpoint`);
                const deadband = v;
                const heating = getValue(`${path}.heating`);
                const cooling = getValue(`${path}.cooling`);
                const label = createSetpointLabel("all", { setpoint, deadband, heating, cooling });
                handleChange(`${path}`, editing)({ deadband, label });
              }}
            />
          </Label>
        </div>
        <div className="error">
          <h4>{error}</h4>
        </div>
        <div></div>
      </div>
      {renderSliders()}
    </>
  );
}
