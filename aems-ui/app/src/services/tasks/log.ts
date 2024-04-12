import { logger } from "@/logging";
import prisma from "@/prisma";
import { parseBoolean } from "@/utils/util";

import { buildOptions, schedule, startService } from "../util";
import { ServiceState } from "../types";

const execute = (_options: LogOptions) => async () => {
  logger.info("Clearing existing log messages...");
  const started = new Date(new Date().getTime() + process.uptime() * 1000);
  return prisma.log
    .deleteMany({ where: { createdAt: { lt: started } } })
    .then(() => {
      logger.info("Successfully cleared old log messages.");
    })
    .catch((error) => {
      logger.warn({ message: error.message, stack: error.stack });
    });
};

interface LogState {}

interface LogOptions extends ServiceState<LogState> {}

const task = () => {
  const options: LogOptions = buildOptions(
    {
      service: "log",
      schedule: undefined,
      leading: parseBoolean(process.env.LOG_CLEAN),
    },
    {}
  );
  const worker = execute(options);
  schedule(worker, options);
};

if (!startService(__filename, { name: "Log Service" })?.catch((error) => logger.warn(error))) {
  task();
}
