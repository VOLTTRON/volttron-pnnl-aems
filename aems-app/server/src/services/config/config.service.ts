import { AppConfigService } from "@/app.config";
import { BaseService } from "..";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Cron } from "@nestjs/schedule";
import { Mutation, StageType, typeofObject } from "@local/common";
import { merge } from "lodash";
import { VolttronService } from "../volttron.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { Schedule } from "@prisma/client";

@Injectable()
export class ConfigService extends BaseService {
  private logger = new Logger(ConfigService.name);

  constructor(
    private prismaService: PrismaService,
    private subscriptionService: SubscriptionService,
    @Inject(AppConfigService.Key) private configService: AppConfigService,
    private volttronService: VolttronService,
  ) {
    super("config", configService);
  }

  @Cron(`*/10 * * * * *`)
  execute(): Promise<void> {
    return super.execute();
  }

  private buildOccupancyPayload(schedule?: Schedule | null) {
    return schedule?.occupied
      ? /(00:00)|(24:00)/.test(schedule?.startTime ?? "00:00") && /(00:00)|(24:00)/.test(schedule?.endTime ?? "24:00")
        ? "always_on"
        : {
            start: schedule?.startTime,
            end: /(00:00)|(24:00)/.test(schedule?.endTime ?? "00:00") ? "23:59" : schedule?.endTime,
          }
      : "always_off";
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
            this.logger.log(`Pushing the unit config for: ${unit.label} (ID: ${unit.id})`);
            try {
              // Set stage to Processing before starting API calls
              await this.prismaService.prisma.unit.update({
                where: { id: unit.id },
                data: { stage: StageType.ProcessType.enum, message: "Synchronizing with Volttron..." },
              });
              await this.subscriptionService.publish("Unit", {
                topic: "Unit",
                id: unit.id,
                mutation: Mutation.Updated,
              });
              await this.subscriptionService.publish(`Unit/${unit.id}`, {
                topic: "Unit",
                id: unit.id,
                mutation: Mutation.Updated,
              });

              this.logger.debug(`[${unit.label}] Setting temperature setpoints...`);
              const set_temperature_setpoints = {
                OccupiedSetPoint: unit.configuration?.setpoint?.setpoint ?? 0,
                DeadBand: (unit.configuration?.setpoint?.deadband ?? 0) / 2,
                UnoccupiedCoolingSetPoint: unit.configuration?.setpoint?.cooling ?? 0,
                UnoccupiedHeatingSetPoint: unit.configuration?.setpoint?.heating ?? 0,
                StandbyTime: unit.configuration?.setpoint?.standbyTime ?? 0,
                StandbyTemperatureOffset: unit.configuration?.setpoint?.standbyOffset ?? 0,
              };
              await this.volttronService.makeApiCall(
                `manager.${unit.system.toLowerCase()}`,
                "set_temperature_setpoints",
                token,
                set_temperature_setpoints,
              );
              this.logger.debug(`[${unit.label}] Temperature setpoints updated successfully`);

              this.logger.debug(`[${unit.label}] Setting occupancy overrides...`);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const set_occupancy_override = unit.configuration?.occupancies
                .filter((v) => v.date.getTime() >= today.getTime())
                .reduce(
                  (p, c) => {
                    const k = `${c.date.getFullYear().toString()}-${(c.date.getMonth() + 1).toString().padStart(2, "0")}-${c.date.getDate().toString().padStart(2, "0")}`;
                    const v = this.buildOccupancyPayload(c.schedule);
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
              this.logger.debug(`[${unit.label}] Occupancy overrides updated successfully`);

              this.logger.debug(`[${unit.label}] Setting holidays...`);
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
              this.logger.debug(`[${unit.label}] Holidays updated successfully`);

              this.logger.debug(`[${unit.label}] Setting weekly schedule...`);
              const set_schedule = {
                Monday: this.buildOccupancyPayload(unit.configuration?.mondaySchedule),
                Tuesday: this.buildOccupancyPayload(unit.configuration?.tuesdaySchedule),
                Wednesday: this.buildOccupancyPayload(unit.configuration?.wednesdaySchedule),
                Thursday: this.buildOccupancyPayload(unit.configuration?.thursdaySchedule),
                Friday: this.buildOccupancyPayload(unit.configuration?.fridaySchedule),
                Saturday: this.buildOccupancyPayload(unit.configuration?.saturdaySchedule),
                Sunday: this.buildOccupancyPayload(unit.configuration?.sundaySchedule),
                ...(this.configService.service.config.holidaySchedule && {
                  Holiday: this.buildOccupancyPayload(unit.configuration?.holidaySchedule),
                }),
              };
              await this.volttronService.makeApiCall(
                `manager.${unit.system.toLowerCase()}`,
                "set_schedule",
                token,
                set_schedule,
              );
              this.logger.debug(`[${unit.label}] Weekly schedule updated successfully`);

              this.logger.debug(`[${unit.label}] Setting optimal start parameters...`);
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
              this.logger.debug(`[${unit.label}] Optimal start parameters updated successfully`);

              this.logger.debug(`[${unit.label}] Setting system configurations...`);
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
              this.logger.debug(`[${unit.label}] System configurations updated successfully`);

              this.logger.debug(`[${unit.label}] Setting location...`);
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
              this.logger.debug(`[${unit.label}] Location updated successfully`);

              this.logger.debug(`[${unit.label}] All API calls completed successfully, setting stage to Complete`);
              await this.prismaService.prisma.unit.update({
                where: { id: unit.id },
                data: { stage: StageType.CompleteType.enum },
              });
              await this.subscriptionService.publish("Unit", {
                topic: "Unit",
                id: unit.id,
                mutation: Mutation.Updated,
              });
              await this.subscriptionService.publish(`Unit/${unit.id}`, {
                topic: "Unit",
                id: unit.id,
                mutation: Mutation.Updated,
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
              await this.subscriptionService.publish("Unit", {
                topic: "Unit",
                id: unit.id,
                mutation: Mutation.Updated,
              });
              await this.subscriptionService.publish(`Unit/${unit.id}`, {
                topic: "Unit",
                id: unit.id,
                mutation: Mutation.Updated,
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
