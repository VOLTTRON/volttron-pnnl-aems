import { ReadSetpointQuery } from "@/graphql-codegen/graphql";
import { Validate, checkSetpoint } from "@local/common";

// UI slider bounds and defaults, re-exported from Validate so the UI stays off magic numbers.
const SETPOINT_PADDING = 2;
const DEADBAND_MIN = Validate.Deadband.options?.min as number;
const DEADBAND_MAX = Validate.Deadband.options?.max as number;
const DEADBAND_DEFAULT = Validate.Deadband.options?.default as number;
const OVERRIDE_SETPOINT_MIN = Validate.OverrideSetpoint.options?.min as number;
const OVERRIDE_SETPOINT_MAX = Validate.OverrideSetpoint.options?.max as number;
const OVERRIDE_SETPOINT_DEFAULT = Validate.OverrideSetpoint.options?.default as number;
const OVERRIDE_DEADBAND_MIN = Validate.OverrideDeadband.options?.min as number;
const OVERRIDE_DEADBAND_MAX = Validate.OverrideDeadband.options?.max as number;
const OVERRIDE_DEADBAND_DEFAULT = Validate.OverrideDeadband.options?.default as number;
const HEATING_MIN = Validate.Heating.options?.min as number;
const HEATING_DEFAULT = Validate.Heating.options?.default as number;
const COOLING_MAX = Validate.Cooling.options?.max as number;
const COOLING_DEFAULT = Validate.Cooling.options?.default as number;
const SETPOINT_MIN = Validate.Setpoint.options?.min as number;
const SETPOINT_MAX = Validate.Setpoint.options?.max as number;
const SETPOINT_DEFAULT = Validate.Setpoint.options?.default as number;
const STANDBY_TIME_MIN = Validate.StandbyTime.options?.min as number;
const STANDBY_TIME_MAX = Validate.StandbyTime.options?.max as number;
const STANDBY_TIME_DEFAULT = Validate.StandbyTime.options?.default as number;
const STANDBY_OFFSET_MIN = Validate.StandbyOffset.options?.min as number;
const STANDBY_OFFSET_MAX = Validate.StandbyOffset.options?.max as number;
const STANDBY_OFFSET_DEFAULT = Validate.StandbyOffset.options?.default as number;

type SetpointType = NonNullable<ReadSetpointQuery["readSetpoint"]>;

type Required =
  | "setpoint"
  | "deadband"
  | "overrideSetpoint"
  | "overrideDeadband"
  | "heating"
  | "cooling"
  | "standbyTime"
  | "standbyOffset";

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
    case "standbyTime":
      return `${setpoint.standbyTime} min`;
    case "setpoint":
    case "deadband":
    case "overrideSetpoint":
    case "overrideDeadband":
    case "heating":
    case "cooling":
    case "standbyOffset":
    default:
      return `${setpoint[type]}º\xa0F`;
  }
};

const getSetpointMessage = (setpoint: SetpointType): string | undefined => {
  const reason = checkSetpoint({
    setpoint: setpoint?.setpoint ?? 0,
    deadband: setpoint?.deadband ?? 0,
    overrideSetpoint: setpoint?.overrideSetpoint ?? 0,
    overrideDeadband: setpoint?.overrideDeadband ?? 0,
    heating: setpoint?.heating ?? 0,
    cooling: setpoint?.cooling ?? 0,
    standbyTime: setpoint?.standbyTime ?? 0,
    standbyOffset: setpoint?.standbyOffset ?? 0,
  });
  if (reason) return reason;
  // UI-only granularity: whole or half degrees on temperatures, whole degrees on deadbands.
  if ((setpoint?.setpoint ?? 0) % 0.5 !== 0) return "Occupied setpoint must be a whole or half degree.";
  if ((setpoint?.deadband ?? 0) % 1 !== 0) return "Deadband must be a whole degree.";
  if ((setpoint?.heating ?? 0) % 0.5 !== 0 || (setpoint?.cooling ?? 0) % 0.5 !== 0) {
    return "Unoccupied heating or cooling must be a whole or half degree.";
  }
  if ((setpoint?.overrideDeadband ?? 0) % 1 !== 0) return "Override deadband must be a whole degree.";
  if ((setpoint?.overrideSetpoint ?? 0) % 0.5 !== 0) return "Override setpoint must be a whole or half degree.";
};

const isSetpointValid = (setpoint: SetpointType | undefined): boolean => {
  if (
    !setpoint ||
    typeof setpoint.setpoint !== "number" ||
    typeof setpoint.deadband !== "number" ||
    typeof setpoint.overrideSetpoint !== "number" ||
    typeof setpoint.overrideDeadband !== "number" ||
    typeof setpoint.heating !== "number" ||
    typeof setpoint.cooling !== "number" ||
    typeof setpoint.standbyTime !== "number" ||
    typeof setpoint.standbyOffset !== "number"
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
  OVERRIDE_SETPOINT_MIN,
  OVERRIDE_SETPOINT_MAX,
  OVERRIDE_SETPOINT_DEFAULT,
  OVERRIDE_DEADBAND_MIN,
  OVERRIDE_DEADBAND_MAX,
  OVERRIDE_DEADBAND_DEFAULT,
  HEATING_MIN,
  HEATING_DEFAULT,
  COOLING_MAX,
  COOLING_DEFAULT,
  SETPOINT_MIN,
  SETPOINT_MAX,
  SETPOINT_DEFAULT,
  STANDBY_TIME_MIN,
  STANDBY_TIME_MAX,
  STANDBY_TIME_DEFAULT,
  STANDBY_OFFSET_MIN,
  STANDBY_OFFSET_MAX,
  STANDBY_OFFSET_DEFAULT,
  createSetpointLabel,
  getSetpointMessage,
  isSetpointValid,
  isSetpointDelete,
  type SetpointType,
};
