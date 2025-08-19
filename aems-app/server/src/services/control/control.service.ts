import { Inject, Injectable, Logger } from "@nestjs/common";
import { BaseService } from "..";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
import { Cron } from "@nestjs/schedule";
import { StageType, typeofObject } from "@local/common";
import { basename, extname } from "node:path";
import { readFile } from "node:fs/promises";
import { VolttronService } from "../volttron.service";
import { getConfigFiles } from "@/utils/file";
import { transformTemplate } from "@/utils/template";

@Injectable()
export class ControlService extends BaseService {
  private logger = new Logger(ControlService.name);

  constructor(
    private prismaService: PrismaService,
    @Inject(AppConfigService.Key) private configService: AppConfigService,
    private volttronService: VolttronService,
  ) {
    super("control", configService);
  }

  @Cron(`*/10 * * * * *`)
  execute(): Promise<void> {
    return super.execute();
  }

  async task() {
    this.logger.debug(`Checking for intelligent load controls that need to be pushed...`);
    try {
      await this.prismaService.prisma.control
        .findMany({
          include: {
            units: {
              include: {
                configuration: {
                  include: {
                    setpoint: true,
                    mondaySchedule: true,
                    tuesdaySchedule: true,
                    wednesdaySchedule: true,
                    thursdaySchedule: true,
                    fridaySchedule: true,
                    saturdaySchedule: true,
                    sundaySchedule: true,
                    holidaySchedule: true,
                    holidays: true,
                    occupancies: { include: { schedule: true } },
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          where: { stage: { in: [StageType.Update.enum, StageType.Process.enum] } },
        })
        .then(async (controls) => {
          const token = await this.volttronService.makeAuthCall();
          for (const control of controls) {
            this.logger.log(`Pushing the control config for: ${control.label}`);
            try {
              if (control.peakLoadExclude) {
                control.units = [];
              }
              await this.prismaService.prisma.control.update({
                where: { id: control.id },
                data: { stage: StageType.ProcessType.enum, message: null },
              });
              const data: Record<string, any> = {};
              for (const file of await getConfigFiles(
                this.configService.service.control.templatePaths,
                ".json",
                this.logger,
              )) {
                const key = basename(file, extname(file));
                const text = await readFile(file, "utf-8");
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const template = control.units ? JSON.parse(text) : {};
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                data[key] = transformTemplate(template, control);
              }
              await this.volttronService.makeApiCall(`agent.ilc`, "update_configurations", token, data);
              await this.prismaService.prisma.control.update({
                where: { id: control.id },
                data: { stage: StageType.CompleteType.enum },
              });
              this.logger.log(`Finished pushing the control config for: ${control.label}`);
            } catch (error: any) {
              this.logger.warn(error, `Failed to push the control config for: ${control.label}`);
              let message = typeofObject<Error>(error, (e) => "message" in e)
                ? error.message
                : "Unknown error occurred while pushing control config.";
              message = message.length > 1024 ? message.substring(0, 1024 - 3) + "..." : message;
              await this.prismaService.prisma.control.update({
                where: { id: control.id },
                data: { stage: StageType.FailType.enum, message: message },
              });
            }
          }
        })
        .catch((err) => this.logger.warn(err));
    } catch (error) {
      this.logger.warn(error);
    }
    this.logger.debug(`Finished pushing control configs.`);
  }
}
