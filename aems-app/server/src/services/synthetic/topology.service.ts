import { Inject, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";

const BUILDINGS = ["BLDG_A", "BLDG_B", "BLDG_C"] as const;
const SYSTEMS = ["RTU_1", "RTU_2", "AHU_1"] as const;

interface CampusSpec {
  slug: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

const CAMPUSES: readonly CampusSpec[] = [
  { slug: "CAMPUS_RICHLAND", displayName: "Richland", latitude: 46.28, longitude: -119.28 },
  { slug: "CAMPUS_SEQUIM", displayName: "Sequim", latitude: 48.08, longitude: -123.1 },
];

export interface SyntheticUnit {
  id: string;
  campus: string;
  building: string;
  system: string;
}

export interface TopologyResult {
  units: SyntheticUnit[];
  buildings: { campus: string; building: string }[];
}

@Injectable()
export class SyntheticTopologyService {
  private readonly logger = new Logger(SyntheticTopologyService.name);

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(AppConfigService.Key) private readonly configService: AppConfigService,
  ) {}

  private prefix(slug: string): string {
    return `${this.configService.service.synthetic.campusPrefix}${slug}`;
  }

  async apply(): Promise<TopologyResult> {
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

    const units: SyntheticUnit[] = [];
    const buildings: { campus: string; building: string }[] = [];

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
    return { units, buildings };
  }
}
