import { isNumber, sum } from "lodash";

// Constants for setpoint validation and defaults
const SETPOINT_PADDING = 2;
const DEADBAND_MIN = 2;
const DEADBAND_MAX = 6;
const DEADBAND_DEFAULT = 4;
const HEATING_MIN = 55;
const HEATING_DEFAULT = 60;
const COOLING_MAX = 85;
const COOLING_DEFAULT = 80;
const SETPOINT_MIN = HEATING_MIN;
const SETPOINT_MAX = COOLING_MAX;
const SETPOINT_DEFAULT = 70;

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface ISetpoint {
  id?: number;
  label?: string;
  setpoint: number;
  deadband: number;
  heating: number;
  cooling: number;
  occupied?: boolean;
  _count?: Record<string, number>;
}

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
  type ISetpoint,
};
