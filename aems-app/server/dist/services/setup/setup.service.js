"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SetupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupService = void 0;
const common_1 = require("@local/common");
const common_2 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const lodash_1 = require("lodash");
const __1 = require("..");
const prisma_service_1 = require("../../prisma/prisma.service");
const app_config_1 = require("../../app.config");
const schedule_1 = require("@nestjs/schedule");
const node_path_1 = require("node:path");
const promises_1 = require("node:fs/promises");
const file_1 = require("../../utils/file");
const subscription_service_1 = require("../../subscription/subscription.service");
const transform = (v) => (0, lodash_1.upperFirst)((0, lodash_1.snakeCase)(v));
const createConfigurationLabel = (unit) => {
    const now = new Date();
    const formatter = Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const parts = formatter
        .formatToParts(now)
        .reduce((acc, part) => ({ [part.type]: part.value, ...acc }), {});
    return `${unit.label} - ${parts.weekday}, ${parts.month} ${(0, common_1.toOrdinal)(now.getDate())} ${parts.year}`;
};
const createSetpointLabel = (type, setpoint) => {
    switch (type) {
        case "all":
            return `Occupied Setpoint: ${createSetpointLabel("setpoint", setpoint)} Deadband: ${createSetpointLabel("deadband", setpoint)} Unoccupied Heating: ${createSetpointLabel("heating", setpoint)} Cooling: ${createSetpointLabel("cooling", setpoint)}`;
        case "standbyTime":
            return `${setpoint[type]}\xa0min`;
        case "setpoint":
        case "deadband":
        case "heating":
        case "cooling":
        case "standbyOffset":
        default:
            return `${setpoint[type]}º\xa0F`;
    }
};
const parseTimeStringToMinutes = (timeString, upper) => {
    if (timeString.includes("a") || timeString.includes("p") || timeString.includes("A") || timeString.includes("P")) {
        const cleanTime = timeString.replace(/\xa0/g, " ").trim();
        const isPM = cleanTime.toLowerCase().includes("p");
        const timeOnly = cleanTime.replace(/[ap]m?/gi, "").trim();
        const [hours, minutes] = timeOnly.split(":").map(Number);
        let adjustedHours = hours;
        if (isPM && hours !== 12) {
            adjustedHours += 12;
        }
        else if (!isPM && hours === 12) {
            adjustedHours = 0;
        }
        return toUpperBound(adjustedHours, 24, upper) * 60 + minutes;
    }
    const [hours, minutes] = timeString.split(":").map(Number);
    return toUpperBound(hours, 24, upper) * 60 + minutes;
};
const formatToDataFormat = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};
const formatToTimeFormat = (totalMinutes) => {
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    let hours12 = hours24;
    let period = "am";
    if (hours24 === 0) {
        hours12 = 12;
    }
    else if (hours24 === 12) {
        hours12 = 12;
        period = "pm";
    }
    else if (hours24 > 12) {
        hours12 = hours24 - 12;
        period = "pm";
    }
    return `${hours12}:${minutes.toString().padStart(2, "0")}\xa0${period}`;
};
const toDataFormat = (value) => formatToDataFormat(value);
const toTimeFormat = (value) => formatToTimeFormat(value);
const toUpperBound = (value, boundary, upper) => (upper && value === 0 ? boundary : value);
const toMinutes = (value, upper) => {
    if (!value)
        return 0;
    return parseTimeStringToMinutes(value, upper);
};
const createScheduleLabel = (type, schedule) => {
    const occupied = schedule?.occupied === undefined ? true : schedule.occupied;
    const startTime = (0, lodash_1.isNumber)(schedule.startTime) ? schedule.startTime : toMinutes(schedule.startTime, false);
    const endTime = (0, lodash_1.isNumber)(schedule.endTime) ? schedule.endTime : toMinutes(schedule.endTime, true);
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
const createConfigurationDefault = (unit) => {
    const label = createConfigurationLabel(unit);
    const setpoint = {
        label: "",
        setpoint: common_1.ValidateType.Setpoint.options?.default,
        deadband: common_1.ValidateType.Deadband.options?.default,
        heating: common_1.ValidateType.Heating.options?.default,
        cooling: common_1.ValidateType.Cooling.options?.default,
        standbyTime: common_1.ValidateType.StandbyTime.options?.default,
        standbyOffset: common_1.ValidateType.StandbyOffset.options?.default,
    };
    setpoint.label = createSetpointLabel("all", setpoint);
    const schedule = {
        label: "",
        occupied: common_1.ValidateType.OccupiedType.options?.default,
        startTime: common_1.ValidateType.StartTimeType.options?.default,
        endTime: common_1.ValidateType.EndTimeType.options?.default,
    };
    schedule.label = createScheduleLabel("all", schedule);
    const unoccupied = {
        label: "",
        occupied: false,
        startTime: common_1.ValidateType.StartTimeType.options?.default,
        endTime: common_1.ValidateType.EndTimeType.options?.default,
    };
    unoccupied.label = createScheduleLabel("all", unoccupied);
    const enabled = [
        common_1.HolidayType.NewYearsDay,
        common_1.HolidayType.MemorialDay,
        common_1.HolidayType.Juneteenth,
        common_1.HolidayType.IndependenceDay,
        common_1.HolidayType.LaborDay,
        common_1.HolidayType.Thanksgiving,
        common_1.HolidayType.BlackFriday,
        common_1.HolidayType.ChristmasEve,
        common_1.HolidayType.Christmas,
    ].map((h) => h.name);
    const holidays = common_1.HolidayType.values.map((h) => ({
        label: h.label,
        type: enabled.includes(h.name) ? client_1.HolidayType.Enabled : client_1.HolidayType.Disabled,
    }));
    return (0, lodash_1.merge)(unit, {
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
const updateConfigurationDefaults = (unit, json) => {
    (0, lodash_1.set)(unit, "configuration.setpoint.deadband", (0, lodash_1.get)(json, "default_setpoints.DeadBand", (0, lodash_1.get)(unit, "configuration.setpoint.deadband", 0) / 2) * 2);
    for (const [k, v] of [
        ["configuration.setpoint.setpoint", "default_setpoints.OccupiedSetPoint"],
        ["configuration.setpoint.heating", "default_setpoints.UnoccupiedHeatingSetPoint"],
        ["configuration.setpoint.cooling", "default_setpoints.UnoccupiedCoolingSetPoint"],
    ]) {
        (0, lodash_1.set)(unit, k, (0, lodash_1.get)(json, v, (0, lodash_1.get)(unit, k)));
    }
    (0, lodash_1.set)(unit, "configuration.setpoint.label", createSetpointLabel("all", (0, lodash_1.get)(unit, "configuration.setpoint")));
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
        if ((0, lodash_1.get)(unit, v) === "always_off") {
            (0, lodash_1.set)(unit, k, true);
        }
        else {
            (0, lodash_1.set)(unit, `${k}.startTime`, toDataFormat((0, lodash_1.get)(json, `${v}.start`, (0, lodash_1.get)(unit, `${k}.startTime`))));
            (0, lodash_1.set)(unit, `${k}.endTime`, toDataFormat((0, lodash_1.get)(json, `${v}.end`, (0, lodash_1.get)(unit, `${k}.endTime`))));
        }
        (0, lodash_1.set)(unit, `${k}.label`, createScheduleLabel("all", (0, lodash_1.get)(unit, k)));
    }
};
const transformUnit = (v, t) => {
    if ((0, lodash_1.isObject)(v)) {
        return Object.entries(v).reduce((p, [k, v]) => {
            if ((0, lodash_1.isString)(k) && k !== "id") {
                if ([
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
                    (0, lodash_1.isObject)(v)) {
                    (0, lodash_1.set)(p, `${k}.${t}`, transformUnit(v, t));
                }
                else if (["holidays"].includes(k) && (0, lodash_1.isArray)(v)) {
                    (0, lodash_1.set)(p, `${k}.${t}`, v);
                }
                else {
                    (0, lodash_1.set)(p, k, transformUnit(v, t));
                }
            }
            return p;
        }, {});
    }
    else {
        return v;
    }
};
let SetupService = SetupService_1 = class SetupService extends __1.BaseService {
    constructor(prismaService, subscriptionService, configService) {
        super("setup", configService);
        this.prismaService = prismaService;
        this.subscriptionService = subscriptionService;
        this.configService = configService;
        this.logger = new common_2.Logger(SetupService_1.name);
    }
    execute() {
        return super.execute();
    }
    async task() {
        this.logger.log(`Checking for units that need to be created...`);
        const units = [];
        const thermostatPaths = this.configService.service.setup.thermostatPaths.map((p) => (0, node_path_1.resolve)(p));
        for (const file of await (0, file_1.getConfigFiles)(thermostatPaths, ".config", this.logger)) {
            const text = await (0, promises_1.readFile)((0, node_path_1.resolve)(file), "utf-8");
            const json = JSON.parse(text);
            const { campus, building, system, local_tz: timezone, } = json ?? {
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
                }
                else {
                    this.logger.log(`Creating thermostat unit "${name}".`);
                    const data = createConfigurationDefault({ name, label, campus, building, system, timezone });
                    const record = transformUnit(data, "create");
                    record.stage = common_1.StageType.Update.enum;
                    await this.prismaService.prisma.unit
                        .create({
                        data: record,
                    })
                        .then(async (unit) => {
                        await this.subscriptionService.publish("Unit", {
                            topic: "Unit",
                            id: unit.id,
                            mutation: common_1.Mutation.Created,
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
            const remove = (0, lodash_1.difference)(values.map((v) => v?.name).filter((v) => v), units.map((v) => v?.name).filter((v) => v)).filter(common_1.typeofNonNullable);
            for (const name of remove) {
                this.logger.log(`Removing thermostat unit "${name}" from the database.`);
                await this.prismaService.prisma.unit.deleteMany({ where: { name } });
            }
        })
            .catch((error) => this.logger.warn(`Failed to look for thermostat units:`, error));
        this.logger.log(`Finished checking for thermostat units to create or update.`);
        this.logger.log(`Checking for controls that need to be created...`);
        const controls = await this.prismaService.prisma.control
            .findMany({ include: { units: true } })
            .catch((error) => this.logger.warn(`Failed to look for controls:`, error));
        const configs = [];
        const ilcPaths = this.configService.service.setup.ilcPaths.map((p) => (0, node_path_1.resolve)(process.cwd(), p));
        for (const file of await (0, file_1.getConfigFiles)(ilcPaths, ".json", this.logger)) {
            const text = await (0, promises_1.readFile)((0, node_path_1.resolve)(process.cwd(), file), "utf-8");
            const json = JSON.parse(text);
            const { campus, building, systems } = json;
            const name = `${transform(campus)}-${transform(building)}`;
            let control = controls?.find((v) => v.name === name);
            if (!control) {
                const label = `${campus} ${building}`;
                this.logger.log(`Creating control (ILC) "${name}" in the database.`);
                const stage = common_1.StageType.CreateType.enum;
                control = await this.prismaService.prisma.control.create({
                    include: { units: true },
                    data: { name, label, campus, building, stage },
                });
                await this.subscriptionService.publish("Control", {
                    topic: "Control",
                    id: control.id,
                    mutation: common_1.Mutation.Created,
                });
            }
            configs.push({ control: control.name, units: [] });
            for (const system of systems) {
                const temp = `${name}-${transform(system)}`;
                configs[configs.length - 1].units.push(temp);
                const unit = units.find((v) => v?.name === temp);
                if (!unit) {
                    this.logger.warn(new Error(`Unit "${temp}" specified in control (ILC) config does not exist.`));
                }
                else if (unit.controlId !== control.id) {
                    this.logger.log(`Assigning unit "${unit.name}" to  control (ILC) "${name}".`);
                    await this.prismaService.prisma.unit.update({ where: { id: unit.id }, data: { controlId: control.id } });
                    await this.subscriptionService.publish("Unit", { topic: "Unit", id: unit.id, mutation: common_1.Mutation.Updated });
                    await this.subscriptionService.publish(`Unit/${unit.id}`, {
                        topic: "Unit",
                        id: unit.id,
                        mutation: common_1.Mutation.Updated,
                    });
                }
            }
        }
        const removeControls = (0, lodash_1.difference)(controls?.map((v) => v?.name).filter((v) => v) ?? [], configs.map((c) => c.control)).filter((v) => v);
        if (!(0, lodash_1.isEmpty)(removeControls)) {
            this.logger.log(`Deleting control${removeControls.length === 1 ? "" : "s"} (ILC) ${removeControls.map((v) => `"${v}"`).join(", ")}.`);
            await this.prismaService.prisma.control.deleteMany({ where: { name: { in: removeControls } } });
            for (const control of controls?.filter((c) => removeControls.includes(c.name)) ?? []) {
                await this.subscriptionService.publish("Control", {
                    topic: "Control",
                    id: control.id,
                    mutation: common_1.Mutation.Deleted,
                });
                await this.subscriptionService.publish(`Control/${control.id}`, {
                    topic: "Control",
                    id: control.id,
                    mutation: common_1.Mutation.Deleted,
                });
            }
        }
        const removeUnits = (0, lodash_1.difference)(units.map((v) => v?.name).filter((v) => v), (0, lodash_1.flatten)(configs.map((n) => n.units))).filter((v) => v);
        if (!(0, lodash_1.isEmpty)(removeUnits)) {
            this.logger.log(`Unassigning unit${removeUnits.length === 1 ? "" : "s"} ${removeUnits
                .map((v) => `"${v}"`)
                .join(", ")} from controls (ILC).`);
            await this.prismaService.prisma.unit.updateMany({
                where: { name: { in: removeUnits } },
                data: { controlId: null },
            });
            for (const unit of units.filter((u) => removeUnits.includes(u.name))) {
                await this.subscriptionService.publish("Unit", { topic: "Unit", id: unit.id, mutation: common_1.Mutation.Updated });
                await this.subscriptionService.publish(`Unit/${unit.id}`, {
                    topic: "Unit",
                    id: unit.id,
                    mutation: common_1.Mutation.Updated,
                });
            }
        }
        this.logger.log(`Finished checking for controls (ILC) to create or update.`);
    }
};
exports.SetupService = SetupService;
__decorate([
    (0, schedule_1.Timeout)(1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SetupService.prototype, "execute", null);
exports.SetupService = SetupService = SetupService_1 = __decorate([
    (0, common_2.Injectable)(),
    __param(2, (0, common_2.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        app_config_1.AppConfigService])
], SetupService);
//# sourceMappingURL=setup.service.js.map