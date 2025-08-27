import { AppConfigService } from "@/app.config";
import { BaseService } from "..";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Cron } from "@nestjs/schedule";
import { StageType, typeofObject } from "@local/common";
import { merge } from "lodash";
import { VolttronService } from "../volttron.service";

@Injectable()
export class ConfigService extends BaseService {
  private logger = new Logger(ConfigService.name);

  constructor(
    private prismaService: PrismaService,
    @Inject(AppConfigService.Key) private configService: AppConfigService,
    private volttronService: VolttronService,
  ) {
    super("config", configService);
  }

  @Cron(`*/10 * * * * *`)
  execute(): Promise<void> {
    return super.execute();
  }

  async task() {
    this.logger.debug(`Checking for unit configs that need to be pushed...`);
    try {
      await this.prismaService.prisma.unit
        .findMany({
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
            location: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          where: { stage: { in: [StageType.Update.enum, StageType.Process.enum] } },
        })
        .then(async (units) => {
          if (units.length === 0) {
            return;
          }
          const token = await this.volttronService.makeAuthCall();
          for (const unit of units) {
            this.logger.log(`Pushing the unit config for: ${unit.label}`);
            try {
              await this.prismaService.prisma.unit.update({
                where: { id: unit.id },
                data: { stage: StageType.ProcessType.enum, message: null },
              });

              const set_temperature_setpoints = {
                OccupiedSetPoint: unit.configuration?.setpoint?.setpoint ?? 0,
                DeadBand: (unit.configuration?.setpoint?.deadband ?? 0) / 2,
                UnoccupiedCoolingSetPoint: unit.configuration?.setpoint?.cooling ?? 0,
                UnoccupiedHeatingSetPoint: unit.configuration?.setpoint?.heating ?? 0,
              };
              await this.volttronService.makeApiCall(
                `manager.${unit.system.toLowerCase()}`,
                "set_temperature_setpoints",
                token,
                set_temperature_setpoints,
              );

              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const set_occupancy_override = unit.configuration?.occupancies
                .filter((v) => v.date.getTime() >= today.getTime())
                .reduce(
                  (p, c) => {
                    const k = `${c.date.getFullYear().toString()}-${(c.date.getMonth() + 1).toString().padStart(2, "0")}-${c.date.getDate().toString().padStart(2, "0")}`;
                    const v = c.schedule?.occupied
                      ? {
                          start: c.schedule?.startTime,
                          end: c.schedule?.endTime,
                        }
                      : "always_off";
                    if (k in p) {
                      p[k].push(v);
                    } else {
                      p[k] = [v];
                    }
                    return p;
                  },
                  {} as Record<string, any[]>,
                );
              await this.volttronService.makeApiCall(
                `manager.${unit.system.toLowerCase()}`,
                "set_occupancy_override",
                token,
                set_occupancy_override,
              );

              const set_holidays = unit.configuration?.holidays
                .filter((a) => a.type !== "Disabled")
                .reduce(
                  (p, c) =>
                    merge(p, {
                      [c.label]: c.type === "Custom" ? { month: c.month, day: c.day, observance: c.observance } : {},
                    }),
                  {},
                );
              await this.volttronService.makeApiCall(
                `manager.${unit.system.toLowerCase()}`,
                "set_holidays",
                token,
                set_holidays,
              );

              const set_schedule = {
                Monday: unit.configuration?.mondaySchedule?.occupied
                  ? {
                      start: unit.configuration?.mondaySchedule?.startTime,
                      end: unit.configuration?.mondaySchedule?.endTime,
                    }
                  : "always_off",
                Tuesday: unit.configuration?.tuesdaySchedule?.occupied
                  ? {
                      start: unit.configuration?.tuesdaySchedule?.startTime,
                      end: unit.configuration?.tuesdaySchedule?.endTime,
                    }
                  : "always_off",
                Wednesday: unit.configuration?.wednesdaySchedule?.occupied
                  ? {
                      start: unit.configuration?.wednesdaySchedule?.startTime,
                      end: unit.configuration?.wednesdaySchedule?.endTime,
                    }
                  : "always_off",
                Thursday: unit.configuration?.thursdaySchedule?.occupied
                  ? {
                      start: unit.configuration?.thursdaySchedule?.startTime,
                      end: unit.configuration?.thursdaySchedule?.endTime,
                    }
                  : "always_off",
                Friday: unit.configuration?.fridaySchedule?.occupied
                  ? {
                      start: unit.configuration?.fridaySchedule?.startTime,
                      end: unit.configuration?.fridaySchedule?.endTime,
                    }
                  : "always_off",
                Saturday: unit.configuration?.saturdaySchedule?.occupied
                  ? {
                      start: unit.configuration?.saturdaySchedule?.startTime,
                      end: unit.configuration?.saturdaySchedule?.endTime,
                    }
                  : "always_off",
                Sunday: unit.configuration?.sundaySchedule?.occupied
                  ? {
                      start: unit.configuration?.sundaySchedule?.startTime,
                      end: unit.configuration?.sundaySchedule?.endTime,
                    }
                  : "always_off",
                ...(this.configService.service.config.holidaySchedule && {
                  Holiday: unit.configuration?.holidaySchedule?.occupied
                    ? {
                        start: unit.configuration?.holidaySchedule?.startTime,
                        end: unit.configuration?.holidaySchedule?.endTime,
                      }
                    : "always_off",
                }),
              };
              await this.volttronService.makeApiCall(
                `manager.${unit.system.toLowerCase()}`,
                "set_schedule",
                token,
                set_schedule,
              );

              const set_optimal_start = {
                latest_start_time: unit.latestStart ?? 0,
                earliest_start_time: unit.earliestStart ?? 0,
                allowable_setpoint_deviation: 1,
                optimal_start_lockout_temperature: unit.optimalStartLockout ?? 0,
              };
              await this.volttronService.makeApiCall(
                `manager.${unit.system.toLowerCase()}`,
                "set_optimal_start",
                token,
                set_optimal_start,
              );

              const set_configurations = {
                is_heatpump: unit.heatPump ?? false,
                ...(unit.heatPump && {
                  heating_lockout_temp: unit.heatPumpLockout ?? 0,
                }),
                has_economizer: unit.economizer ?? false,
                ...(unit.economizer && {
                  economizer_setpoint: unit.economizerSetpoint ?? 0,
                  cooling_lockout_temp: unit.coolingLockout ?? 0,
                }),
              };
              await this.volttronService.makeApiCall(
                `manager.${unit.system.toLowerCase()}`,
                "set_configurations",
                token,
                {
                  ...set_configurations,
                  ...set_optimal_start,
                },
              );

              const location = unit.location;
              await this.volttronService.makeApiCall(
                `manager.${unit.system.toLowerCase()}`,
                "set_location",
                token,
                location
                  ? {
                      lat: location.latitude,
                      long: location.longitude,
                    }
                  : {},
              );

              await this.prismaService.prisma.unit.update({
                where: { id: unit.id },
                data: { stage: StageType.CompleteType.enum },
              });
              this.logger.log(`Finished pushing the unit config for: ${unit.label}`);
            } catch (error: any) {
              this.logger.warn(error, `Failed to push the unit config for: ${unit.label}`);
              let message = typeofObject<Error>(error, (e) => "message" in e)
                ? error.message
                : "Unknown error occurred while pushing unit config.";
              message = message.length > 1024 ? message.substring(0, 1024 - 3) + "..." : message;
              await this.prismaService.prisma.unit.update({
                where: { id: unit.id },
                data: { stage: StageType.FailType.enum, message: message },
              });
            }
          }
        })
        .catch((err) => this.logger.warn(err));
    } catch (error) {
      this.logger.warn(error);
    }
    this.logger.debug(`Finished pushing unit configs.`);
  }
}
