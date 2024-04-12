import "pino-pretty";
import "pino-prisma";

import { merge } from "lodash";
import pino from "pino";

import { LogType } from "@/common";

const transports = (process.env.LOG_TRANSPORTS ?? "")
  .split(/[, |-]+/)
  .map((v) => v.trim())
  .filter((v) => v.length > 0);

const logger = pino({
  name: process.env.PROJECT_NAME,
  browser: {},
  level: process.env.LOG_GLOBAL_LEVEL ?? "debug",
  transport: {
    targets: [
      {
        name: "console",
        level: process.env.LOG_CONSOLE_LEVEL ?? "",
        target: "pino-pretty",
        options: {
          colorize: true,
          destination: 1,
        },
      },
      {
        name: "file",
        level: process.env.LOG_FILE_LEVEL ?? "",
        target: "pino/file",
        options: { destination: process.env.LOG_FILE_PATH ?? "./server.log", mkdir: true },
      },
      {
        name: "database",
        level: process.env.LOG_DATABASE_LEVEL ?? "",
        target: "pino-prisma",
        options: {
          levels: LogType.values.reduce((a, v) => merge(a, { [v.name]: v.enum, [v.level]: v.enum }), {}),
        },
      },
    ].filter((v) => transports.includes(v.name) && v.level.length > 0),
  },
  base: {
    env: process.env.NODE_ENV,
    revision: process.env.VERCEL_GITHUB_COMMIT_SHA,
  },
});

export { logger };
