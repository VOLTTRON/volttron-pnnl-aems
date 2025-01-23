import { readFile } from "fs/promises";
import {
  difference,
  flatten,
  get,
  isArray,
  isEmpty,
  isNumber,
  isObject,
  isString,
  merge,
  set,
  snakeCase,
  upperFirst,
} from "lodash";
import moment from "moment";
import { resolve } from "path";

import { HolidayType, StageType, ValidateType } from "@/common";
import { logger } from "@/logging";
import { prisma } from "@/prisma";
import { parseBoolean } from "@/utils/util";
import { Configurations, enum_holiday, Holidays, Schedules, Setpoints, Units } from "@prisma/client";

import { buildOptions, schedule, startService } from "../util";
import { ServiceState } from "../types";

const DATA_FORMAT = "HH:mm";
const TIME_FORMAT = "h:mm\xa0a";
const CONFIG_FORMAT = "H:mm";

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

type UnitsFull = Units & {
  configuration: Configurations & {
    setpoint: Setpoints;
    mondaySchedule: Schedules;
    tuesdaySchedule: Schedules;
    wednesdaySchedule: Schedules;
    thursdaySchedule: Schedules;
    fridaySchedule: Schedules;
    saturdaySchedule: Schedules;
    sundaySchedule: Schedules;
    holidaySchedule: Schedules;
    holidays: Holidays[];
  };
};

const transform = (v: string): string => upperFirst(snakeCase(v));

const createConfigurationLabel = (unit: Partial<Units>) => {
  return `${unit.label} - ${moment().format("dddd, MMMM Do YYYY")}`;
};

const createSetpointLabel = (type: "all" | "setpoint" | "deadband" | "heating" | "cooling", setpoint: any): string => {
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

const toDataFormat = (value: string) => moment(value, [CONFIG_FORMAT, TIME_FORMAT, DATA_FORMAT]).format(DATA_FORMAT);

const toTimeFormat = (value: number) =>
  moment("00:00", [DATA_FORMAT, CONFIG_FORMAT, TIME_FORMAT])
    .add(Math.trunc(value / 60), "hours")
    .add(value % 60, "minutes")
    .format(TIME_FORMAT);

const toUpperBound = (value: number, boundary: number, upper?: boolean) => (upper && value === 0 ? boundary : value);

const toMinutes = (value?: string, upper?: boolean) =>
  toUpperBound(moment(value, [DATA_FORMAT, TIME_FORMAT]).hours(), 24, upper) * 60 +
  moment(value, [DATA_FORMAT, TIME_FORMAT]).minutes();

const createScheduleLabel = (type: "all" | "startTime" | "endTime", schedule: any): string => {
  const occupied = schedule?.occupied === undefined ? true : schedule.occupied;
  const startTime = isNumber(schedule.startTime) ? schedule.startTime : toMinutes(schedule.startTime, false);
  const endTime = isNumber(schedule.endTime) ? schedule.endTime : toMinutes(schedule.endTime, true);
  switch (type) {
    case "startTime":
      return `${toTimeFormat(startTime)}`;
    case "endTime":
      return `${toTimeFormat(endTime)}`;
    case "all":
    default:
      return occupied
        ? startTime === 0 && endTime === 1440
          ? "Occupied All Day"
          : `Occupied From Start Time: ${toTimeFormat(startTime)} To End Time: ${toTimeFormat(endTime)}`
        : "Unoccupied All Day";
  }
};

const createConfigurationDefault = (unit: Partial<Units>): DeepPartial<UnitsFull> => {
  const label = createConfigurationLabel(unit);
  const setpoint: Partial<Setpoints> = {
    label: "",
    setpoint: ValidateType.SetpointType.options?.default as number,
    deadband: ValidateType.DeadbandType.options?.default as number,
    heating: ValidateType.HeatingType.options?.default as number,
    cooling: ValidateType.CoolingType.options?.default as number,
  };
  setpoint.label = createSetpointLabel("all", setpoint);
  const schedule: Partial<Schedules> = {
    label: "",
    occupied: ValidateType.OccupiedType.options?.default as boolean,
    startTime: ValidateType.StartTimeType.options?.default as string,
    endTime: ValidateType.EndTimeType.options?.default as string,
  };
  schedule.label = createScheduleLabel("all", schedule);
  const unoccupied: Partial<Schedules> = {
    label: "",
    occupied: false,
    startTime: ValidateType.StartTimeType.options?.default as string,
    endTime: ValidateType.EndTimeType.options?.default as string,
  };
  unoccupied.label = createScheduleLabel("all", unoccupied);
  const enabled = [
    HolidayType.NewYearsDayType,
    HolidayType.MemorialDayType,
    HolidayType.JuneteenthType,
    HolidayType.IndependenceDayType,
    HolidayType.LaborDayType,
    HolidayType.ThanksgivingType,
    HolidayType.BlackFridayType,
    HolidayType.ChristmasEveType,
    HolidayType.ChristmasType,
  ].map((h) => h.name);
  const holidays = HolidayType.values.map((h) => ({
    label: h.label,
    type: enabled.includes(h.name) ? enum_holiday.Enabled : enum_holiday.Disabled,
  }));
  return merge(unit, {
    configuration: {
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
    },
  });
};

const updateConfigurationDefaults = (unit: DeepPartial<UnitsFull>, json: any) => {
  set(
    unit,
    "configuration.setpoint.deadband",
    get(json, "default_setpoints.DeadBand", get(unit, "configuration.setpoint.deadband", 0) / 2) * 2
  );
  for (const [k, v] of [
    ["configuration.setpoint.setpoint", "default_setpoints.OccupiedSetPoint"],
    ["configuration.setpoint.heating", "default_setpoints.UnoccupiedHeatingSetPoint"],
    ["configuration.setpoint.cooling", "default_setpoints.UnoccupiedCoolingSetPoint"],
  ]) {
    set(unit, k, get(json, v, get(unit, k)));
  }
  set(unit, "configuration.setpoint.label", createSetpointLabel("all", get(unit, "configuration.setpoint")));
  for (const [k, v] of [
    ["configuration.mondaySchedule", "schedule.Monday"],
    ["configuration.tuesdaySchedule", "schedule.Tuesday"],
    ["configuration.wednesdaySchedule", "schedule.Wednesday"],
    ["configuration.thursdaySchedule", "schedule.Thursday"],
    ["configuration.fridaySchedule", "schedule.Friday"],
    ["configuration.saturdaySchedule", "schedule.Saturday"],
    ["configuration.sundaySchedule", "schedule.Sunday"],
    ["configuration.holidaySchedule", "schedule.Holiday"],
  ]) {
    if (get(unit, v) === "always_off") {
      set(unit, k, true);
    } else {
      set(unit, `${k}.startTime`, toDataFormat(get(json, `${v}.start`, get(unit, `${k}.startTime`))));
      set(unit, `${k}.endTime`, toDataFormat(get(json, `${v}.end`, get(unit, `${k}.endTime`))));
    }
    set(unit, `${k}.label`, createScheduleLabel("all", get(unit, k)));
  }
};

const transformUnit = (v: any, t: "create" | "update") => {
  if (isObject(v)) {
    return Object.entries(v).reduce((p, [k, v]): any => {
      if (isString(k) && k !== "id") {
        if (
          [
            "configuration",
            "setpoint",
            "mondaySchedule",
            "tuesdaySchedule",
            "wednesdaySchedule",
            "thursdaySchedule",
            "fridaySchedule",
            "saturdaySchedule",
            "sundaySchedule",
            "holidaySchedule",
          ].includes(k) &&
          isObject(v)
        ) {
          set(p, `${k}.${t}`, transformUnit(v, t));
        } else if (["holidays"].includes(k) && isArray(v)) {
          set(p, `${k}.${t}`, v);
        } else {
          set(p, k, transformUnit(v, t));
        }
      }
      return p;
    }, {} as any);
  } else {
    return v;
  }
};

const execute = (options: SetupOptions) => async () => {
  logger.info(`Checking for units that need to be created...`);
  const units = await Promise.all(
    options.state.files
      .map(async (f: string) => {
        try {
          const file = resolve(process.cwd(), f);
          const text = await readFile(file, "utf-8");
          const json = JSON.parse(text);
          const { campus, building, system, local_tz: timezone } = json;
          const name = `${transform(campus)}-${transform(building)}-${transform(system)}`;
          const label = `${campus} ${building} ${system}`;
          logger.info(`Checking if unit "${name}" exists.`);
          return await prisma.units
            .findFirst({ where: { name } })
            .then(async (unit) => {
              if (unit) {
                return unit;
              } else {
                logger.info(`Creating unit "${name}".`);
                const data = createConfigurationDefault({ name, label, campus, building, system, timezone });
                updateConfigurationDefaults(data, json);
                const record = transformUnit(data, "create");
                record.stage = StageType.UpdateType.enum;
                return await prisma.units
                  .create({
                    data: record,
                  })
                  .catch((err) => {
                    logger.warn(err);
                    return null;
                  });
              }
            })
            .catch((err) => {
              logger.warn(err);
              return null;
            });
        } catch (error) {
          logger.warn(error as Error);
          return null;
        }
      })
      .filter((v) => v)
  );
  await prisma.units
    .findMany()
    .then(async (values) => {
      const remove = difference(
        values.map((v) => v?.name).filter((v) => v),
        units.map((v) => v?.name).filter((v) => v)
      ).filter((v) => v) as string[];
      for (const name of remove) {
        logger.info(`Removing unit "${name}".`);
        await prisma.units.deleteMany({ where: { name } });
      }
    })
    .catch((err: any) => logger.warn(err));
  logger.info(`Finished checking for units to create or update.`);
  logger.info(`Checking for controls that need to be created...`);
  const controls = await prisma.controls.findMany({ include: { units: true } }).catch((err) => {
    logger.warn(err);
    return null;
  });
  if (controls !== null) {
    const names = await Promise.all(
      options.state.ilcs
        .map(async (f: string) => {
          const names: { controls: string[]; units: string[] } = { controls: [], units: [] };
          try {
            const file = resolve(process.cwd(), f);
            const text = await readFile(file, "utf-8");
            const json = JSON.parse(text);
            const { campus, building, systems }: { campus: string; building: string; systems: string[] } = json;
            const name = `${transform(campus)}-${transform(building)}`;
            let control = controls.find((v) => v.name === name);
            if (!control) {
              const label = `${campus} ${building}`;
              logger.info(`Creating control "${name}".`);
              const stage = StageType.CreateType.enum;
              control = await prisma.controls.create({
                include: { units: true },
                data: { name, label, campus, building, stage },
              });
            }
            names.controls.push(control.name);
            for (const system of systems) {
              const temp = `${name}-${transform(system)}`;
              names.units.push(temp);
              const unit = units.find((v) => v?.name === temp);
              if (!unit) {
                logger.warn(new Error(`Unit "${temp}" specified in control config does not exist.`));
              } else if (unit.controlId !== control.id) {
                logger.info(`Assigning unit "${unit.name}" to  control "${name}".`);
                await prisma.units.update({ where: { id: unit.id }, data: { controlId: control.id } });
              }
            }
            return names;
          } catch (error) {
            logger.warn(error as Error);
            return names;
          }
        })
        .filter((v) => v)
    );
    const removeControls = difference(
      controls.map((v) => v?.name).filter((v) => v),
      flatten(names.map((n) => n.controls))
    ).filter((v) => v) as string[];
    if (!isEmpty(removeControls)) {
      logger.info(
        `Deleting control${removeControls.length === 1 ? "" : "s"} ${removeControls.map((v) => `"${v}"`).join(", ")}.`
      );
      await prisma.controls.deleteMany({ where: { name: { in: removeControls } } });
    }
    const removeUnits = difference(
      units.map((v) => v?.name).filter((v) => v),
      flatten(names.map((n) => n.units))
    ).filter((v) => v) as string[];
    if (!isEmpty(removeUnits)) {
      logger.info(
        `Unassigning unit${removeUnits.length === 1 ? "" : "s"} ${removeUnits
          .map((v) => `"${v}"`)
          .join(", ")} from controls.`
      );
      await prisma.units.updateMany({ where: { name: { in: removeUnits } }, data: { controlId: null } });
    }
  }
  logger.info(`Finished checking for controls to create or update.`);
};

interface SetupState {
  running: boolean;
  count: number;
  files: string[];
  ilcs: string[];
  templates: string[];
  holidaySchedule: boolean;
}

interface SetupOptions extends ServiceState<SetupState> {}

const task = () => {
  const options: SetupOptions = buildOptions(
    {
      service: "setup",
      schedule: process.env.SETUP_SCHEDULE,
      leading: parseBoolean(process.env.SETUP_STARTUP),
    },
    {
      running: false,
      count: 0,
      files: process.env.SETUP_FILES?.split(/[,|]/) || [],
      ilcs: process.env.SETUP_ILC_FILES?.split(/[,|]/) || [],
      templates: process.env.SETUP_TEMPLATE_FILES?.split(/[,|]/) || [],
      holidaySchedule: parseBoolean(process.env.HOLIDAY_SCHEDULE),
    }
  );
  const worker = execute(options);
  schedule(worker, options);
};

if (!startService(__filename, { name: "Setup Service" })?.catch((error) => logger.warn(error))) {
  task();
}
