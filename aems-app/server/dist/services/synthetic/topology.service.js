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
var SyntheticTopologyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyntheticTopologyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const app_config_1 = require("../../app.config");
const BUILDINGS = ["BLDG_A", "BLDG_B", "BLDG_C"];
const SYSTEMS = ["RTU_1", "RTU_2", "AHU_1"];
const CAMPUSES = [
    { slug: "CAMPUS_RICHLAND", displayName: "Richland", latitude: 46.28, longitude: -119.28 },
    { slug: "CAMPUS_SEQUIM", displayName: "Sequim", latitude: 48.08, longitude: -123.1 },
];
let SyntheticTopologyService = SyntheticTopologyService_1 = class SyntheticTopologyService {
    constructor(prismaService, configService) {
        this.prismaService = prismaService;
        this.configService = configService;
        this.logger = new common_1.Logger(SyntheticTopologyService_1.name);
    }
    prefix(slug) {
        return `${this.configService.service.synthetic.campusPrefix}${slug}`;
    }
    async apply() {
        const prefix = this.configService.service.synthetic.campusPrefix;
        const prisma = this.prismaService.prisma;
        const setpointId = `${prefix}setpoint-standard`;
        await prisma.setpoint.upsert({
            where: { id: setpointId },
            update: { label: "DEMO Standard Office" },
            create: {
                id: setpointId,
                label: "DEMO Standard Office",
                setpoint: 70,
                deadband: 4,
                overrideSetpoint: 70,
                overrideDeadband: 4,
                heating: 68,
                cooling: 74,
                standbyTime: 15,
                standbyOffset: 2,
            },
        });
        const weekdayId = `${prefix}schedule-weekday`;
        const weekendId = `${prefix}schedule-weekend`;
        const holidayId = `${prefix}schedule-holiday`;
        await prisma.schedule.upsert({
            where: { id: weekdayId },
            update: { label: "DEMO Weekday", setpointId },
            create: {
                id: weekdayId,
                label: "DEMO Weekday",
                startTime: "06:00",
                endTime: "18:00",
                occupied: true,
                setpointId,
            },
        });
        await prisma.schedule.upsert({
            where: { id: weekendId },
            update: { label: "DEMO Weekend", setpointId },
            create: {
                id: weekendId,
                label: "DEMO Weekend",
                startTime: "08:00",
                endTime: "12:00",
                occupied: false,
                setpointId,
            },
        });
        await prisma.schedule.upsert({
            where: { id: holidayId },
            update: { label: "DEMO Holiday", setpointId },
            create: {
                id: holidayId,
                label: "DEMO Holiday",
                startTime: "00:00",
                endTime: "00:00",
                occupied: false,
                setpointId,
            },
        });
        const configurationId = `${prefix}configuration-standard`;
        await prisma.configuration.upsert({
            where: { id: configurationId },
            update: {
                label: "DEMO Standard Configuration",
                setpointId,
                mondayScheduleId: weekdayId,
                tuesdayScheduleId: weekdayId,
                wednesdayScheduleId: weekdayId,
                thursdayScheduleId: weekdayId,
                fridayScheduleId: weekdayId,
                saturdayScheduleId: weekendId,
                sundayScheduleId: weekendId,
                holidayScheduleId: holidayId,
            },
            create: {
                id: configurationId,
                label: "DEMO Standard Configuration",
                setpointId,
                mondayScheduleId: weekdayId,
                tuesdayScheduleId: weekdayId,
                wednesdayScheduleId: weekdayId,
                thursdayScheduleId: weekdayId,
                fridayScheduleId: weekdayId,
                saturdayScheduleId: weekendId,
                sundayScheduleId: weekendId,
                holidayScheduleId: holidayId,
            },
        });
        const units = [];
        const buildings = [];
        for (const campusSpec of CAMPUSES) {
            const campus = this.prefix(campusSpec.slug);
            for (let b = 0; b < BUILDINGS.length; b++) {
                const building = BUILDINGS[b];
                buildings.push({ campus, building });
                const locationId = `${prefix}location-${campusSpec.slug}-${building}`;
                await prisma.location.upsert({
                    where: { id: locationId },
                    update: {
                        name: `${campusSpec.displayName} ${building}`,
                        latitude: campusSpec.latitude + (b - 1) * 0.01,
                        longitude: campusSpec.longitude + (b - 1) * 0.01,
                    },
                    create: {
                        id: locationId,
                        name: `${campusSpec.displayName} ${building}`,
                        latitude: campusSpec.latitude + (b - 1) * 0.01,
                        longitude: campusSpec.longitude + (b - 1) * 0.01,
                    },
                });
                const controlId = `${prefix}control-${campusSpec.slug}-${building}`;
                await prisma.control.upsert({
                    where: { id: controlId },
                    update: {
                        name: `${campus}/${building}`,
                        campus,
                        building,
                        label: `DEMO ${campusSpec.displayName} ${building}`,
                    },
                    create: {
                        id: controlId,
                        name: `${campus}/${building}`,
                        campus,
                        building,
                        label: `DEMO ${campusSpec.displayName} ${building}`,
                    },
                });
                for (const system of SYSTEMS) {
                    const unitId = `${prefix}unit-${campusSpec.slug}-${building}-${system}`;
                    const name = `${campus}/${building}/${system}`;
                    await prisma.unit.upsert({
                        where: { id: unitId },
                        update: {
                            name,
                            campus,
                            building,
                            system,
                            label: `DEMO ${campusSpec.displayName} ${building} ${system}`,
                            configurationId,
                            controlId,
                            locationId,
                        },
                        create: {
                            id: unitId,
                            name,
                            campus,
                            building,
                            system,
                            label: `DEMO ${campusSpec.displayName} ${building} ${system}`,
                            configurationId,
                            controlId,
                            locationId,
                        },
                    });
                    units.push({ id: unitId, campus, building, system });
                }
            }
        }
        this.logger.log(`Topology upserted: ${units.length} units across ${buildings.length} buildings.`);
        const seededUserIds = ["1", "2", "3"];
        const unitRefs = units.map((u) => ({ id: u.id }));
        let connectedUsers = 0;
        for (const userId of seededUserIds) {
            try {
                await prisma.user.update({
                    where: { id: userId },
                    data: { units: { connect: unitRefs } },
                });
                connectedUsers++;
            }
            catch (err) {
                this.logger.warn(`Skipped ACL wiring for user ${userId}: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
        this.logger.log(`Connected ${connectedUsers} seeded users to ${units.length} DEMO units.`);
        return { units, buildings };
    }
};
exports.SyntheticTopologyService = SyntheticTopologyService;
exports.SyntheticTopologyService = SyntheticTopologyService = SyntheticTopologyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_1.AppConfigService])
], SyntheticTopologyService);
//# sourceMappingURL=topology.service.js.map