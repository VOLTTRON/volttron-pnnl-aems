/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  DeepPartial,
  HolidayType as Holidays,
  Mutation,
  StageType,
  toOrdinal,
  typeofNonNullable,
  ValidateType,
} from "@local/common";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Configuration, Holiday, HolidayType, Schedule, Setpoint, Unit } from "@prisma/client";
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
import { BaseService } from "..";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
import { Timeout } from "@nestjs/schedule";
import { extname, resolve } from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";
import { getConfigFiles } from "@/utils/file";
import { SubscriptionService } from "@/subscription/subscription.service";

type UnitFull = Unit & {
  configuration: Configuration & {
    setpoint: Setpoint;
    mondaySchedule: Schedule;
    tuesdaySchedule: Schedule;
    wednesdaySchedule: Schedule;
    thursdaySchedule: Schedule;
    fridaySchedule: Schedule;
    saturdaySchedule: Schedule;
    sundaySchedule: Schedule;
    holidaySchedule: Schedule;
    holidays: Holiday[];
  };
};

const transform = (v: string): string => upperFirst(snakeCase(v));

const createConfigurationLabel = (unit: Partial<Unit>) => {
  const now = new Date();
  const formatter = Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const parts = formatter
    .formatToParts(now)
    .reduce((acc, part) => ({ [part.type]: part.value, ...acc }), {} as Record<Intl.DateTimeFormatPartTypes, string>);
  return `${unit.label} - ${parts.weekday}, ${parts.month} ${toOrdinal(now.getDate())} ${parts.year}`;
};

const createSetpointLabel = (type: "all" | "setpoint" | "deadband" | "heating" | "cooling", setpoint: any): string => {
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

// Helper function to parse time string in various formats (HH:mm or h:mm a)
const parseTimeStringToMinutes = (timeString: string, upper?: boolean): number => {
  // Handle 12-hour format (h:mm a)
  if (timeString.includes("a") || timeString.includes("p") || timeString.includes("A") || timeString.includes("P")) {
    const cleanTime = timeString.replace(/\xa0/g, " ").trim();
    const isPM = cleanTime.toLowerCase().includes("p");
    const timeOnly = cleanTime.replace(/[ap]m?/gi, "").trim();
    const [hours, minutes] = timeOnly.split(":").map(Number);

    let adjustedHours = hours;
    if (isPM && hours !== 12) {
      adjustedHours += 12;
    } else if (!isPM && hours === 12) {
      adjustedHours = 0;
    }

    return toUpperBound(adjustedHours, 24, upper) * 60 + minutes;
  }

  // Handle 24-hour format (HH:mm)
  const [hours, minutes] = timeString.split(":").map(Number);
  return toUpperBound(hours, 24, upper) * 60 + minutes;
};

// Helper function to format minutes to HH:mm format
const formatToDataFormat = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

// Helper function to format minutes to h:mm a format
const formatToTimeFormat = (totalMinutes: number): string => {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let hours12 = hours24;
  let period = "a";

  if (hours24 === 0) {
    hours12 = 12;
  } else if (hours24 === 12) {
    hours12 = 12;
    period = "p";
  } else if (hours24 > 12) {
    hours12 = hours24 - 12;
    period = "p";
  }

  return `${hours12}:${minutes.toString().padStart(2, "0")}\xa0${period}`;
};

const toDataFormat = (value: number) => formatToDataFormat(value);

const toTimeFormat = (value: number) => formatToTimeFormat(value);

const toUpperBound = (value: number, boundary: number, upper?: boolean) => (upper && value === 0 ? boundary : value);

const toMinutes = (value?: string, upper?: boolean) => {
  if (!value) return 0;
  return parseTimeStringToMinutes(value, upper);
};

const createScheduleLabel = (type: "all" | "startTime" | "endTime", schedule: Partial<Schedule>): string => {
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

const createConfigurationDefault = (unit: Partial<Unit>): DeepPartial<UnitFull> => {
  const label = createConfigurationLabel(unit);
  const setpoint: Partial<Setpoint> = {
    label: "",
    setpoint: ValidateType.Setpoint.options?.default as number,
    deadband: ValidateType.Deadband.options?.default as number,
    heating: ValidateType.Heating.options?.default as number,
    cooling: ValidateType.Cooling.options?.default as number,
  };
  setpoint.label = createSetpointLabel("all", setpoint);
  const schedule: Partial<Schedule> = {
    label: "",
    occupied: ValidateType.OccupiedType.options?.default as boolean,
    startTime: ValidateType.StartTimeType.options?.default as string,
    endTime: ValidateType.EndTimeType.options?.default as string,
  };
  schedule.label = createScheduleLabel("all", schedule);
  const unoccupied: Partial<Schedule> = {
    label: "",
    occupied: false,
    startTime: ValidateType.StartTimeType.options?.default as string,
    endTime: ValidateType.EndTimeType.options?.default as string,
  };
  unoccupied.label = createScheduleLabel("all", unoccupied);
  const enabled = [
    Holidays.NewYearsDay,
    Holidays.MemorialDay,
    Holidays.Juneteenth,
    Holidays.IndependenceDay,
    Holidays.LaborDay,
    Holidays.Thanksgiving,
    Holidays.BlackFriday,
    Holidays.ChristmasEve,
    Holidays.Christmas,
  ].map((h) => h.name);
  const holidays = Holidays.values.map((h) => ({
    label: h.label,
    type: enabled.includes(h.name) ? HolidayType.Enabled : HolidayType.Disabled,
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const updateConfigurationDefaults = (unit: DeepPartial<UnitFull>, json: any) => {
  set(
    unit,
    "configuration.setpoint.deadband",
    get(json, "default_setpoints.DeadBand", get(unit, "configuration.setpoint.deadband", 0) / 2) * 2,
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return v;
  }
};

@Injectable()
export class SetupService extends BaseService {
  private logger = new Logger(SetupService.name);

  constructor(
    private prismaService: PrismaService,
    private subscriptionService: SubscriptionService,
    @Inject(AppConfigService.Key) private configService: AppConfigService,
  ) {
    super("setup", configService);
  }

  async getIlcFiles(paths: string[]) {
    const files: string[] = [];
    for (const path of paths) {
      const file = resolve(process.cwd(), path);
      const dirent = await stat(file);
      if (dirent.isFile()) {
        if (extname(file) === ".json") {
          files.push(file);
        }
      } else if (dirent.isDirectory()) {
        files.push(...(await this.getIlcFiles(await readdir(file))));
      } else {
        this.logger.warn(`Skipping non-file and non-directory: ${file}`);
      }
    }
    return files;
  }

  @Timeout(1000)
  execute(): Promise<void> {
    return super.execute();
  }

  async task() {
    this.logger.log(`Checking for units that need to be created...`);
    const units: Unit[] = [];
    const thermostatPaths = this.configService.service.setup.thermostatPaths.map((p) => resolve(p));
    for (const file of await getConfigFiles(thermostatPaths, ".config", this.logger)) {
      const text = await readFile(resolve(file), "utf-8");
      const json = JSON.parse(text);
      const {
        campus,
        building,
        system,
        local_tz: timezone,
      }: { campus: string; building: string; system: string; local_tz: string } = json ?? {
        campus: "",
        building: "",
        system: "",
        local_tz: "",
      };

      const name = `${transform(campus)}-${transform(building)}-${transform(system)}`;
      const label = `${campus} ${building} ${system}`;
      this.logger.log(`Checking if thermostat unit "${name}" already exists in the database.`);
      await this.prismaService.prisma.unit
        .findFirst({ where: { name } })
        .then(async (unit) => {
          if (unit) {
            units.push(unit);
          } else {
            this.logger.log(`Creating thermostat unit "${name}".`);
            const data = createConfigurationDefault({ name, label, campus, building, system, timezone });
            // updateConfigurationDefaults(data, json);
            const record = transformUnit(data, "create");
            record.stage = StageType.Update.enum;
            await this.prismaService.prisma.unit
              .create({
                data: record,
              })
              .then(async (unit) => {
                await this.subscriptionService.publish("Unit", {
                  topic: "Unit",
                  id: unit.id,
                  mutation: Mutation.Created,
                });
                units.push(unit);
              })
              .catch((error) => this.logger.warn(`Failed to create unit "${name}":`, error));
          }
        })
        .catch((error) => this.logger.warn(`Failed to look for thermostat unit "${name}":`, error));
    }
    await this.prismaService.prisma.unit
      .findMany()
      .then(async (values) => {
        const remove = difference(
          values.map((v) => v?.name).filter((v) => v),
          units.map((v) => v?.name).filter((v) => v),
        ).filter(typeofNonNullable);
        for (const name of remove) {
          this.logger.log(`Removing thermostat unit "${name}" from the database.`);
          await this.prismaService.prisma.unit.deleteMany({ where: { name } });
        }
      })
      .catch((error: any) => this.logger.warn(`Failed to look for thermostat units:`, error));
    this.logger.log(`Finished checking for thermostat units to create or update.`);
    this.logger.log(`Checking for controls that need to be created...`);
    const controls = await this.prismaService.prisma.control
      .findMany({ include: { units: true } })
      .catch((error) => this.logger.warn(`Failed to look for controls:`, error));
    const configs: { control: string; units: string[] }[] = [];
    const ilcPaths = this.configService.service.setup.ilcPaths.map((p) => resolve(process.cwd(), p));
    for (const file of await getConfigFiles(ilcPaths, ".json", this.logger)) {
      const text = await readFile(resolve(process.cwd(), file), "utf-8");
      const json = JSON.parse(text);
      const { campus, building, systems }: { campus: string; building: string; systems: string[] } = json;
      const name = `${transform(campus)}-${transform(building)}`;
      let control = controls?.find((v) => v.name === name);
      if (!control) {
        const label = `${campus} ${building}`;
        this.logger.log(`Creating control (ILC) "${name}" in the database.`);
        const stage = StageType.CreateType.enum;
        control = await this.prismaService.prisma.control.create({
          include: { units: true },
          data: { name, label, campus, building, stage },
        });
        await this.subscriptionService.publish("Control", {
          topic: "Control",
          id: control.id,
          mutation: Mutation.Created,
        });
      }
      configs.push({ control: control.name, units: [] as string[] });
      for (const system of systems) {
        const temp = `${name}-${transform(system)}`;
        configs[configs.length - 1].units.push(temp);
        const unit = units.find((v) => v?.name === temp);
        if (!unit) {
          this.logger.warn(new Error(`Unit "${temp}" specified in control (ILC) config does not exist.`));
        } else if (unit.controlId !== control.id) {
          this.logger.log(`Assigning unit "${unit.name}" to  control (ILC) "${name}".`);
          await this.prismaService.prisma.unit.update({ where: { id: unit.id }, data: { controlId: control.id } });
          await this.subscriptionService.publish("Unit", { topic: "Unit", id: unit.id, mutation: Mutation.Updated });
          await this.subscriptionService.publish(`Unit/${unit.id}`, {
            topic: "Unit",
            id: unit.id,
            mutation: Mutation.Updated,
          });
        }
      }
    }
    const removeControls = difference(
      controls?.map((v) => v?.name).filter((v) => v) ?? [],
      configs.map((c) => c.control),
    ).filter((v) => v);
    if (!isEmpty(removeControls)) {
      this.logger.log(
        `Deleting control${removeControls.length === 1 ? "" : "s"} (ILC) ${removeControls.map((v) => `"${v}"`).join(", ")}.`,
      );
      await this.prismaService.prisma.control.deleteMany({ where: { name: { in: removeControls } } });
      for (const control of controls?.filter((c) => removeControls.includes(c.name)) ?? []) {
        await this.subscriptionService.publish("Control", {
          topic: "Control",
          id: control.id,
          mutation: Mutation.Deleted,
        });
        await this.subscriptionService.publish(`Control/${control.id}`, {
          topic: "Control",
          id: control.id,
          mutation: Mutation.Deleted,
        });
      }
    }
    const removeUnits = difference(
      units.map((v) => v?.name).filter((v) => v),
      flatten(configs.map((n) => n.units)),
    ).filter((v) => v);
    if (!isEmpty(removeUnits)) {
      this.logger.log(
        `Unassigning unit${removeUnits.length === 1 ? "" : "s"} ${removeUnits
          .map((v) => `"${v}"`)
          .join(", ")} from controls (ILC).`,
      );
      await this.prismaService.prisma.unit.updateMany({
        where: { name: { in: removeUnits } },
        data: { controlId: null },
      });
      for (const unit of units.filter((u) => removeUnits.includes(u.name))) {
        await this.subscriptionService.publish("Unit", { topic: "Unit", id: unit.id, mutation: Mutation.Updated });
        await this.subscriptionService.publish(`Unit/${unit.id}`, {
          topic: "Unit",
          id: unit.id,
          mutation: Mutation.Updated,
        });
      }
    }
    this.logger.log(`Finished checking for controls (ILC) to create or update.`);
  }
}
