import axios from "axios";
import { has, isEmpty, isString, merge } from "lodash";
import moment from "moment";
import { inspect } from "util";

import { StageType } from "@/common";
import { logger } from "@/logging";
import prisma from "@/prisma";
import { parseBoolean } from "@/utils/util";
import { Units } from "@prisma/client";

import httpsAgent from "../agent";
import { buildOptions, schedule, startService } from "../util";
import { ServiceState } from "../types";

async function makeApiCall(options: LogOptions, unit: Units, method: string, token: string | undefined, data: any) {
  const body = {
    jsonrpc: "2.0",
    id: `manager.${unit.system.toLowerCase()}`,
    method: method,
    params: {
      authentication: token,
      data: data,
    },
  };
  const response = await axios
    .post(`${options.state.apiUrl}`, body, {
      timeout: options.state.timeout,
      ...(httpsAgent && { httpsAgent: httpsAgent, keepAlive: false }),
    })
    .catch((err) => ({ data: { error: err } }));
  if (options.state.verbose) {
    logger.info(inspect({ url: options.state.apiUrl, body: body }, undefined, 10));
  }
  if (isString(response.data?.error?.message)) {
    throw new Error(`Failed API call to ${method}: ${response.data?.error?.message}`);
  } else if (isString(response.data?.result)) {
    throw new Error(`Failed API call to ${method}: ${inspect(response.data)}`);
  } else if (!response.data?.result) {
    throw new Error(`Failed API call to ${method}.`);
  }
  return response.data;
}

const execute = (options: LogOptions) => async () => {
  logger.debug(`Checking for unit configs that need to be pushed...`);
  try {
    await prisma.units
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
        where: { stage: { in: [StageType.UpdateType.enum, StageType.ProcessType.enum] } },
      })
      .then(async (units) => {
        const response: any =
          !isEmpty(units) &&
          (await axios
            .post(
              `${options.state.authUrl}`,
              { username: options.state.username, password: options.state.password },
              {
                timeout: options.state.timeout,
                ...(httpsAgent && { httpsAgent: httpsAgent, keepAlive: false }),
              }
            )
            .catch((err) => ({ data: { error: err } })));
        const token: string | undefined = response?.data?.access_token;
        for (const unit of units) {
          logger.info(`Pushing the unit config for: ${unit.label}`);
          try {
            if (isString(response?.data?.error?.message)) {
              throw new Error(`Failed authenticate call to ${options.state.authUrl}: ${response.data?.error?.message}`);
            }
            await prisma.units.update({
              where: { id: unit.id },
              data: { stage: StageType.ProcessType.enum, message: null },
            });

            const set_temperature_setpoints = {
              OccupiedSetPoint: unit.configuration?.setpoint?.setpoint ?? 0,
              DeadBand: (unit.configuration?.setpoint?.deadband ?? 0) / 2,
              UnoccupiedCoolingSetPoint: unit.configuration?.setpoint?.cooling ?? 0,
              UnoccupiedHeatingSetPoint: unit.configuration?.setpoint?.heating ?? 0,
            };
            await makeApiCall(options, unit, "set_temperature_setpoints", token, set_temperature_setpoints);

            const today = moment().startOf("day");
            const set_occupancy_override = unit.configuration?.occupancies
              .filter((v) => moment(v.date).isSameOrAfter(today))
              .reduce((p, c) => {
                const k = moment(c.date).format("YYYY-MM-DD");
                const v = c.schedule?.occupied
                  ? {
                      start: c.schedule?.startTime,
                      end: c.schedule?.endTime,
                    }
                  : "always_off";
                if (has(p, k)) {
                  p[k].push(v);
                } else {
                  p[k] = [v];
                }
                return p;
              }, {} as any);
            await makeApiCall(options, unit, "set_occupancy_override", token, set_occupancy_override);

            const set_holidays = unit.configuration?.holidays
              .filter((a) => a.type !== "Disabled")
              .reduce(
                (p, c) =>
                  merge(p, {
                    [c.label]: c.type === "Custom" ? { month: c.month, day: c.day, observance: c.observance } : {},
                  }),
                {}
              );
            await makeApiCall(options, unit, "set_holidays", token, set_holidays);

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
              ...(options.state.holidaySchedule && {
                Holiday: unit.configuration?.holidaySchedule?.occupied
                  ? {
                    start: unit.configuration?.holidaySchedule?.startTime,
                    end: unit.configuration?.holidaySchedule?.endTime,
                  }
                  : "always_off",
              }),
            };
            await makeApiCall(options, unit, "set_schedule", token, set_schedule);

            const set_optimal_start = {
              latest_start_time: unit.latestStart ?? 0,
              earliest_start_time: unit.earliestStart ?? 0,
              allowable_setpoint_deviation: 1,
              optimal_start_lockout_temperature: unit.optimalStartLockout ?? 0,
            };
            await makeApiCall(options, unit, "set_optimal_start", token, set_optimal_start);

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
            await makeApiCall(options, unit, "set_configurations", token, {
              ...set_configurations,
              ...set_optimal_start,
            });

            const location = unit.location;
            await makeApiCall(
              options,
              unit,
              "set_location",
              token,
              location
                ? {
                    lat: location.latitude,
                    long: location.longitude,
                  }
                : {}
            );

            await prisma.units.update({
              where: { id: unit.id },
              data: { stage: StageType.CompleteType.enum },
            });
            logger.info(`Finished pushing the unit config for: ${unit.label}`);
          } catch (err) {
            logger.warn(err, `Failed to push the unit config for: ${unit.label}`);
            let message = ((err as any)?.message as string) || "Unknown error occurred while pushing unit config.";
            message = message.length > 1024 ? message.substring(0, 1024 - 3) + "..." : message;
            await prisma.units.update({
              where: { id: unit.id },
              data: { stage: StageType.FailType.enum, message: message },
            });
          }
        }
      })
      .catch((err) => logger.warn(err));
  } catch (error) {
    logger.warn(error);
  }
  logger.debug(`Finished pushing unit configs.`);
};

interface ConfigState {
  running: boolean;
  count: number;
  authUrl: string;
  apiUrl: string;
  username: string;
  password: string;
  timeout: number;
  verbose: boolean;
  holidaySchedule: boolean;
}

interface LogOptions extends ServiceState<ConfigState> {}

const task = () => {
  const options: LogOptions = buildOptions(
    {
      service: "config",
      schedule: process.env.CONFIG_SCHEDULE,
      leading: parseBoolean(process.env.CONFIG_STARTUP),
    },
    {
      running: false,
      count: 0,
      timeout: parseInt(process.env.CONFIG_TIMEOUT || "5000"),
      authUrl: process.env.CONFIG_AUTH_URL ?? "",
      apiUrl: process.env.CONFIG_API_URL ?? "",
      username: process.env.CONFIG_USERNAME ?? "",
      password: process.env.CONFIG_PASSWORD ?? "",
      verbose: parseBoolean(process.env.CONFIG_VERBOSE),
      holidaySchedule: parseBoolean(process.env.HOLIDAY_SCHEDULE),
    }
  );
  const worker = execute(options);
  schedule(worker, options);
};

if (!startService(__filename, { name: "Config Service" })?.catch((error) => logger.warn(error))) {
  task();
}
