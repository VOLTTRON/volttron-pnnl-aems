import { isNumber, sum } from "lodash";

import { ISetpoint } from "controllers/setpoints/action";
import { ValidateType } from "common";
import { DeepPartial } from "./types";

const SETPOINT_PADDING = parseInt(process.env.REACT_APP_SETPOINT_PADDING || "2");
const DEADBAND_MIN = (ValidateType.DeadbandType.options?.min as number) || 2;
const DEADBAND_MAX = (ValidateType.DeadbandType.options?.max as number) || 6;
const DEADBAND_DEFAULT = (ValidateType.DeadbandType.options?.default as number) || 4;
const HEATING_MIN = (ValidateType.HeatingType.options?.min as number) || 55;
const HEATING_DEFAULT = (ValidateType.HeatingType.options?.default as number) || 60;
const COOLING_MAX = (ValidateType.CoolingType.options?.max as number) || 85;
const COOLING_DEFAULT = (ValidateType.CoolingType.options?.default as number) || 80;
const SETPOINT_MIN = HEATING_MIN;
const SETPOINT_MAX = COOLING_MAX;
const SETPOINT_DEFAULT = (ValidateType.SetpointType.options?.default as number) || 70;

type Required = "setpoint" | "deadband" | "heating" | "cooling";

const createSetpointLabel = (
  type: "all" | Required,
  setpoint: DeepPartial<ISetpoint> & Pick<ISetpoint, Required>
): string => {
  switch (type) {
    case "all":
      return `Occupied Setpoint: ${createSetpointLabel("setpoint", setpoint)} Deadband: ${createSetpointLabel(
        "deadband",
        setpoint
      )} Unoccupied Heating: ${createSetpointLabel("heating", setpoint)} Cooling: ${createSetpointLabel(
        "cooling",
        setpoint
      )}`;
    case "setpoint":
    case "deadband":
    case "heating":
    case "cooling":
    default:
      return `${setpoint[type]}º\xa0F`;
  }
};

const getSetpointMessage = (setpoint: DeepPartial<ISetpoint> & Pick<ISetpoint, Required>): string | undefined => {
  if (setpoint.deadband < DEADBAND_MIN || setpoint.deadband > DEADBAND_MAX) {
    return `Deadband must be in the range [${DEADBAND_MIN},${DEADBAND_MAX}].`;
  } else if (
    setpoint.setpoint < setpoint.heating + SETPOINT_PADDING + setpoint.deadband / 2 ||
    setpoint.setpoint > setpoint.cooling - SETPOINT_PADDING - setpoint.deadband / 2
  ) {
    return `Occupied setpoint must be in the range [${setpoint.heating + SETPOINT_PADDING + setpoint.deadband / 2},${
      setpoint.cooling - SETPOINT_PADDING - setpoint.deadband / 2
    }]`;
  } else if (setpoint.heating < HEATING_MIN || setpoint.cooling > COOLING_MAX) {
    return `Unoccupied heating and cooling must be in the range [${HEATING_MIN},${COOLING_MAX}]`;
  } else if (setpoint.setpoint % 0.5 !== 0) {
    return "Occupied setpoint must be a whole or half degree.";
  } else if (setpoint.deadband % 1 !== 0) {
    return "Deadband must be a whole degree.";
  } else if (setpoint.heating % 0.5 !== 0 || setpoint.cooling % 0.5 !== 0) {
    return "Unoccupied heating or cooling must be a whole or half degree.";
  }
};

const isSetpointValid = (setpoint: DeepPartial<ISetpoint> | undefined): boolean => {
  if (
    !setpoint ||
    !isNumber(setpoint.setpoint) ||
    !isNumber(setpoint.deadband) ||
    !isNumber(setpoint.heating) ||
    !isNumber(setpoint.cooling)
  ) {
    return false;
  }
  return getSetpointMessage(setpoint as DeepPartial<ISetpoint> & Pick<ISetpoint, Required>) === undefined;
};

const isSetpointDelete = (setpoint: DeepPartial<ISetpoint>) => {
  return sum(Object.values(setpoint?._count || {})) === 0;
};

export {
  SETPOINT_PADDING,
  DEADBAND_MIN,
  DEADBAND_MAX,
  DEADBAND_DEFAULT,
  HEATING_MIN,
  HEATING_DEFAULT,
  COOLING_MAX,
  COOLING_DEFAULT,
  SETPOINT_MIN,
  SETPOINT_MAX,
  SETPOINT_DEFAULT,
  createSetpointLabel,
  getSetpointMessage,
  isSetpointValid,
  isSetpointDelete,
};
