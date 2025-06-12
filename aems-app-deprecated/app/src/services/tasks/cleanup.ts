import { logger } from "@/logging";
import { prisma } from "@/prisma";
import { buildOptions, schedule, startService } from "../util";
import { ServiceState } from "../types";
import { Duration, duration } from "moment";
import { StageType } from "@/common";
import { typeofNonNullable } from "@/utils/util";
import { uniq } from "lodash";

const execute = (options: CleanupOptions) => async () => {
  logger.info("Checking for occupancies that need to be cleaned up...");
  return prisma.occupancies
    .findMany({
      where: { date: { lt: new Date(Date.now() - options.state.age.asMilliseconds()) } },
      include: { configuration: { include: { units: true } } },
    })
    .then(async (occupancies) => {
      const occupancyIds = occupancies.map((occupancy) => occupancy.id);
      const unitIds = uniq(
        occupancies
          .map((occupancy) => occupancy.configuration?.units.map((unit) => unit.id))
          .flat()
          .filter((id) => typeofNonNullable(id))
      );
      const result = await prisma.occupancies.deleteMany({
        where: { id: { in: occupancyIds } },
      });
      await prisma.units.updateMany({
        where: { id: { in: unitIds } },
        data: { stage: StageType.ProcessType.enum },
      });
      logger.info(
        `Cleaned up ${result.count} ${
          result.count === 1 ? " occupancy" : " occupancies"
        } that occurred ${options.state.age.humanize()} ago.`
      );
    })
    .catch((error) => {
      logger.warn({ message: error.message, stack: error.stack });
    });
};

interface CleanupState {
  age: Duration;
}

interface CleanupOptions extends ServiceState<CleanupState> {}

const task = () => {
  const result = /(\d+)\s*(\w*)/i.exec(process.env.CLEANUP_AGE ?? "") || [];
  const value = parseInt(result[1]);
  let unit;
  switch (result[2]?.toLowerCase()) {
    case "s":
    case "sec":
    case "second":
    case "seconds":
      unit = "seconds" as const;
      break;
    case "m":
    case "min":
    case "minute":
    case "minutes":
      unit = "minutes" as const;
      break;
    case "h":
    case "hr":
    case "hour":
    case "hours":
      unit = "hours" as const;
      break;
    case "d":
    case "day":
    case "days":
      unit = "days" as const;
      break;
    case "w":
    case "wk":
    case "week":
    case "weeks":
      unit = "weeks" as const;
      break;
    case "mo":
    case "month":
    case "months":
      unit = "months" as const;
      break;
    case "y":
    case "yr":
    case "year":
    case "years":
      unit = "years" as const;
      break;
    default:
      unit = "milliseconds" as const;
  }
  const options: CleanupOptions = buildOptions(
    {
      service: "cleanup",
      schedule: process.env.CLEANUP_SCHEDULE,
      leading: false,
    },
    {
      age: duration(value, unit),
    }
  );
  const worker = execute(options);
  schedule(worker, options);
};

if (!startService(__filename, { name: "Cleanup Service" })?.catch((error) => logger.warn(error))) {
  task();
}
