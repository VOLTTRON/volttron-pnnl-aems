import axios from "axios";
import { readFile } from "fs/promises";
import { isEmpty, isString } from "lodash";
import { basename, extname, resolve } from "path";
import { inspect } from "util";

import { StageType } from "@/common";
import { logger } from "@/logging";
import prisma from "@/prisma";
import { transformTemplate } from "@/utils/template";
import { parseBoolean } from "@/utils/util";
import { Controls } from "@prisma/client";

import httpsAgent from "../agent";
import { buildOptions, schedule, startService } from "../util";
import { ServiceState } from "../types";

async function makeApiCall(
  options: ControlOptions,
  control: Controls,
  method: string,
  token: string | undefined,
  data: any
) {
  const body = {
    jsonrpc: "2.0",
    id: `agent.ilc`,
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

const execute = (options: ControlOptions) => async () => {
  logger.debug(`Checking for intelligent load controls that need to be pushed...`);
  try {
    await prisma.controls
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
        where: { stage: { in: [StageType.UpdateType.enum, StageType.ProcessType.enum] } },
      })
      .then(async (controls) => {
        const response: any =
          !isEmpty(controls) &&
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
        for (const control of controls) {
          logger.info(`Pushing the control config for: ${control.label}`);
          try {
            if (control.peakLoadExclude) {
              control.units = [];
            }
            if (isString(response?.data?.error?.message)) {
              throw new Error(`Failed authenticate call to ${options.state.authUrl}: ${response.data?.error?.message}`);
            }
            await prisma.controls.update({
              where: { id: control.id },
              data: { stage: StageType.ProcessType.enum, message: null },
            });
            const data: Record<string, any> = {};
            for (const path of options.state.templates) {
              const file = resolve(process.cwd(), path);
              const key = basename(file, extname(file));
              const text = await readFile(file, "utf-8");
              const template = control.units ? JSON.parse(text) : {};
              data[key] = transformTemplate(template, control);
            }
            await makeApiCall(options, control, "update_configurations", token, data);
            await prisma.controls.update({
              where: { id: control.id },
              data: { stage: StageType.CompleteType.enum },
            });
            logger.info(`Finished pushing the control config for: ${control.label}`);
          } catch (err) {
            logger.warn(err, `Failed to push the control config for: ${control.label}`);
            let message = ((err as any)?.message as string) || "Unknown error occurred while pushing control config.";
            message = message.length > 1024 ? message.substring(0, 1024 - 3) + "..." : message;
            await prisma.controls.update({
              where: { id: control.id },
              data: { stage: StageType.FailType.enum, message: message },
            });
          }
        }
      })
      .catch((err) => logger.warn(err));
  } catch (error) {
    logger.warn(error);
  }
  logger.debug(`Finished pushing control configs.`);
};

interface ControlState {
  running: boolean;
  count: number;
  authUrl: string;
  apiUrl: string;
  username: string;
  password: string;
  timeout: number;
  verbose: boolean;
  templates: any[];
}

interface ControlOptions extends ServiceState<ControlState> {}

const task = () => {
  const options: ControlOptions = buildOptions(
    {
      service: "control",
      schedule: process.env.CONTROL_SCHEDULE,
      leading: parseBoolean(process.env.CONTROL_STARTUP),
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
      templates: process.env.SETUP_TEMPLATE_FILES?.split(/[,|]/) ?? [],
    }
  );
  const worker = execute(options);
  schedule(worker, options);
};

if (!startService(__filename, { name: "Control Service" })?.catch((error) => logger.warn(error))) {
  task();
}
