import {
  COOLING_DEFAULT,
  DEADBAND_DEFAULT,
  HEATING_DEFAULT,
  SETPOINT_DEFAULT,
  createSetpointLabel,
} from "utils/setpoint";
import { END_TIME_DEFAULT, START_TIME_DEFAULT, createScheduleLabel, toDataFormat } from "utils/schedule";

import { DeepPartial } from "./types";
import { HolidayType } from "common";
import { IConfiguration } from "controllers/configurations/action";
import moment from "moment";
import { sum } from "lodash";

const createConfigurationLabel = (configuration?: DeepPartial<IConfiguration>) => {
  return moment().format("dddd, MMMM Do YYYY");
};

const isConfigurationDelete = (configuration: DeepPartial<IConfiguration>) => {
  return sum(Object.values(configuration?._count || {})) === 0;
};

const createConfigurationDefault = (label: string = createConfigurationLabel()): DeepPartial<IConfiguration> => {
  const setpoint = {
    label: "",
    setpoint: SETPOINT_DEFAULT,
    deadband: DEADBAND_DEFAULT,
    heating: HEATING_DEFAULT,
    cooling: COOLING_DEFAULT,
  };
  setpoint.label = createSetpointLabel("all", setpoint);
  const schedule = {
    label: "",
    occupied: true,
    startTime: toDataFormat(START_TIME_DEFAULT),
    endTime: toDataFormat(END_TIME_DEFAULT),
  };
  schedule.label = createScheduleLabel("all", schedule);
  const unoccupied = {
    label: "",
    occupied: false,
    startTime: toDataFormat(START_TIME_DEFAULT),
    endTime: toDataFormat(END_TIME_DEFAULT),
  };
  unoccupied.label = createScheduleLabel("all", unoccupied);
  const enabled = [
    HolidayType.NewYearsDayType,
    HolidayType.MartinLutherKingJrType,
    HolidayType.PresidentsDayType,
    HolidayType.MemorialDayType,
    HolidayType.JuneteenthType,
    HolidayType.IndependenceDayType,
    HolidayType.LaborDayType,
    HolidayType.ColumbusDayType,
    HolidayType.VeteransDayType,
    HolidayType.ThanksgivingType,
    HolidayType.BlackFridayType,
    HolidayType.ChristmasType,
  ].map((h) => h.name);
  const holidays = HolidayType.values.map((h) => ({
    label: h.label,
    type: enabled.includes(h.name) ? ("Enabled" as const) : ("Disabled" as const),
  }));
  return {
    label,
    setpoint,
    mondaySchedule: schedule,
    tuesdaySchedule: schedule,
    wednesdaySchedule: schedule,
    thursdaySchedule: schedule,
    fridaySchedule: schedule,
    saturdaySchedule: unoccupied,
    sundaySchedule: unoccupied,
    holidaySchedule: unoccupied,
    holidays: holidays,
  };
};

export { createConfigurationLabel, createConfigurationDefault, isConfigurationDelete };
