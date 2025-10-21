import { IUnit } from "controllers/units/action";
import { ValidateType } from "common";
import moment from "moment";
import { sum } from "lodash";
import { DeepPartial } from "./types";

const COOLING_CAPACITY_MIN = ValidateType.CoolingCapacityType.options?.min as number;
const COOLING_CAPACITY_MAX = ValidateType.CoolingCapacityType.options?.max as number;

const COMPRESSORS_MIN = ValidateType.CompressorsType.options?.min as number;
const COMPRESSORS_MAX = ValidateType.CompressorsType.options?.max as number;

const COOLING_LOCKOUT_MIN = ValidateType.CoolingLockoutType.options?.min as number;
const COOLING_LOCKOUT_MAX = ValidateType.CoolingLockoutType.options?.max as number;

const OPTIMAL_START_LOCKOUT_MIN = ValidateType.OptimalStartLockoutType.options?.min as number;
const OPTIMAL_START_LOCKOUT_MAX = ValidateType.OptimalStartLockoutType.options?.max as number;

const OPTIMAL_START_DEVIATION_MIN = ValidateType.OptimalStartDeviationType.options?.min as number;
const OPTIMAL_START_DEVIATION_MAX = ValidateType.OptimalStartDeviationType.options?.max as number;

const EARLIEST_START_MIN = ValidateType.EarliestStartType.options?.min as number;
const EARLIEST_START_MAX = ValidateType.EarliestStartType.options?.max as number;

const LATEST_START_MIN = ValidateType.LatestStartType.options?.min as number;
const LATEST_START_MAX = ValidateType.LatestStartType.options?.max as number;

const HEAT_PUMP_BACKUP_MIN = ValidateType.HeatPumpBackupType.options?.min as number;
const HEAT_PUMP_BACKUP_MAX = ValidateType.HeatPumpBackupType.options?.max as number;

const HEAT_PUMP_LOCKOUT_MIN = ValidateType.HeatPumpLockoutType.options?.min as number;
const HEAT_PUMP_LOCKOUT_MAX = ValidateType.HeatPumpLockoutType.options?.max as number;

const COOLING_PEAK_OFFSET_MIN = ValidateType.CoolingPeakOffsetType.options?.min as number;
const COOLING_PEAK_OFFSET_MAX = ValidateType.CoolingPeakOffsetType.options?.max as number;

const HEATING_PEAK_OFFSET_MIN = ValidateType.HeatingPeakOffsetType.options?.min as number;
const HEATING_PEAK_OFFSET_MAX = ValidateType.HeatingPeakOffsetType.options?.max as number;

const ECONOMIZER_SETPOINT_MIN = ValidateType.EconomizerSetpoint.options?.min as number;
const ECONOMIZER_SETPOINT_MAX = ValidateType.EconomizerSetpoint.options?.max as number;

const createUnitLabel = (unit: DeepPartial<IUnit>) => {
  return moment().format("dddd, MMMM Do YYYY");
};

const isDelete = (unit: DeepPartial<IUnit>) => {
  return sum(Object.values(unit?._count || {})) === 0;
};

export {
  createUnitLabel,
  isDelete,
  COOLING_CAPACITY_MIN,
  COOLING_CAPACITY_MAX,
  COMPRESSORS_MIN,
  COMPRESSORS_MAX,
  COOLING_LOCKOUT_MIN,
  COOLING_LOCKOUT_MAX,
  OPTIMAL_START_LOCKOUT_MIN,
  OPTIMAL_START_LOCKOUT_MAX,
  OPTIMAL_START_DEVIATION_MIN,
  OPTIMAL_START_DEVIATION_MAX,
  EARLIEST_START_MIN,
  EARLIEST_START_MAX,
  LATEST_START_MIN,
  LATEST_START_MAX,
  HEAT_PUMP_BACKUP_MIN,
  HEAT_PUMP_BACKUP_MAX,
  HEAT_PUMP_LOCKOUT_MIN,
  HEAT_PUMP_LOCKOUT_MAX,
  COOLING_PEAK_OFFSET_MIN,
  COOLING_PEAK_OFFSET_MAX,
  HEATING_PEAK_OFFSET_MIN,
  HEATING_PEAK_OFFSET_MAX,
  ECONOMIZER_SETPOINT_MIN,
  ECONOMIZER_SETPOINT_MAX,
};
