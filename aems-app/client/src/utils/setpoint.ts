import { ReadSetpointQuery } from "@/graphql-codegen/graphql";
import { Validate } from "@local/common";
import { isNumber } from "lodash";

// Constants for setpoint validation and defaults
const SETPOINT_PADDING = 2;
const DEADBAND_MIN = Validate.Deadband.options?.min as number;
const DEADBAND_MAX = Validate.Deadband.options?.max as number;
const DEADBAND_DEFAULT = Validate.Deadband.options?.default as number;
const HEATING_MIN = Validate.Heating.options?.min as number;
const HEATING_DEFAULT = Validate.Heating.options?.default as number;
const COOLING_MAX = Validate.Cooling.options?.max as number;
const COOLING_DEFAULT = Validate.Cooling.options?.default as number;
const SETPOINT_MIN = Validate.Setpoint.options?.min as number;
const SETPOINT_MAX = Validate.Setpoint.options?.max as number;
const SETPOINT_DEFAULT = Validate.Setpoint.options?.default as number;

type SetpointType = NonNullable<ReadSetpointQuery["readSetpoint"]>;

type Required = "setpoint" | "deadband" | "heating" | "cooling";

const createSetpointLabel = (type: "all" | Required, setpoint: SetpointType): string => {
  switch (type) {
    case "all":
      return `Occupied Setpoint: ${createSetpointLabel("setpoint", setpoint)} Deadband: ${createSetpointLabel(
        "deadband",
        setpoint,
      )} Unoccupied Heating: ${createSetpointLabel("heating", setpoint)} Cooling: ${createSetpointLabel(
        "cooling",
        setpoint,
      )}`;
    case "setpoint":
    case "deadband":
    case "heating":
    case "cooling":
    default:
      return `${setpoint[type]}º\xa0F`;
  }
};

const getSetpointMessage = (setpoint: SetpointType): string | undefined => {
  if ((setpoint?.deadband ?? 0) < DEADBAND_MIN || (setpoint?.deadband ?? 0) > DEADBAND_MAX) {
    return `Deadband must be in the range [${DEADBAND_MIN},${DEADBAND_MAX}].`;
  } else if (
    (setpoint?.setpoint ?? 0) < (setpoint?.heating ?? 0) + SETPOINT_PADDING + (setpoint?.deadband ?? 0) / 2 ||
    (setpoint?.setpoint ?? 0) > (setpoint?.cooling ?? 0) - SETPOINT_PADDING - (setpoint?.deadband ?? 0) / 2
  ) {
    return `Occupied setpoint must be in the range [${
      (setpoint?.heating ?? 0) + SETPOINT_PADDING + (setpoint?.deadband ?? 0) / 2
    },${(setpoint?.cooling ?? 0) - SETPOINT_PADDING - (setpoint?.deadband ?? 0) / 2}]`;
  } else if ((setpoint?.heating ?? 0) < HEATING_MIN || (setpoint?.cooling ?? 0) > COOLING_MAX) {
    return `Unoccupied heating and cooling must be in the range [${HEATING_MIN},${COOLING_MAX}]`;
  } else if ((setpoint?.setpoint ?? 0) % 0.5 !== 0) {
    return "Occupied setpoint must be a whole or half degree.";
  } else if ((setpoint?.deadband ?? 0) % 1 !== 0) {
    return "Deadband must be a whole degree.";
  } else if ((setpoint?.heating ?? 0) % 0.5 !== 0 || (setpoint?.cooling ?? 0) % 0.5 !== 0) {
    return "Unoccupied heating or cooling must be a whole or half degree.";
  }
};

const isSetpointValid = (setpoint: SetpointType | undefined): boolean => {
  if (
    !setpoint ||
    typeof setpoint.setpoint !== "number" ||
    typeof setpoint.deadband !== "number" ||
    typeof setpoint.heating !== "number" ||
    typeof setpoint.cooling !== "number"
  ) {
    return false;
  }
  return getSetpointMessage(setpoint) === undefined;
};

const isSetpointDelete = (setpoint: SetpointType) => {
  return false;
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
  type SetpointType,
};
