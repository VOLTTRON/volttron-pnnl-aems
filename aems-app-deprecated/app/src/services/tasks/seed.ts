import { extname, resolve } from "path";
import { readFile, readdir, stat } from "fs/promises";

import { logger } from "@/logging";
import { prisma } from "@/prisma";
import { Seed } from "@prisma/client";
import { buildOptions, schedule, startService } from "../util";
import { Seeder, ServiceState } from "../types";
import { omit } from "lodash";

const seedFiles = async (options: SeedOptions, seeders: { filename: string; timestamp: Date }[]) => {
  const seeded: Pick<Seed, "filename" | "timestamp">[] = [];
  const files = await readdir(resolve(process.cwd(), options.state.path), { withFileTypes: true });
  logger.info(`Running the database seeder files...`);
  for (const file of files) {
    try {
      const ext = extname(file.name);
      if (/\.json/i.test(ext)) {
        if (file.isFile()) {
          const metadata = await stat(resolve(process.cwd(), options.state.path, file.name));
          const seed = seeders.find((v) => v.filename === file.name) ?? {
            filename: file.name,
            timestamp: new Date(0),
          };
          if (metadata.mtime > seed.timestamp) {
            logger.info(`Running seeder ${file.name}...`);
            try {
              const seeder = JSON.parse(await readFile(resolve(file.path, file.name), "utf-8")) as Seeder;
              switch (seeder.type) {
                case "upsert":
                  for (const data of seeder.data) {
                    // @ts-expect-error: Unable to determine specific types for json
                    await prisma[seeder.table].upsert({
                      where: { [seeder.id]: data[seeder.id] },
                      update: omit(data, [seeder.id]),
                      create: data,
                    });
                  }
                  break;
                case "create":
                  // @ts-expect-error: Unable to determine specific types for json
                  await prisma[seeder.table].createMany({
                    data: seeder.data,
                    skipDuplicates: true,
                  });
                  break;
                case "update":
                  for (const data of seeder.data) {
                    // @ts-expect-error: Unable to determine specific types for json
                    await prisma[seeder.table].update({
                      where: { [seeder.id]: data[seeder.id] },
                      data: omit(data, [seeder.id]),
                    });
                  }
                  break;
                case "delete":
                  for (const data of seeder.data) {
                    // @ts-expect-error: Unable to determine specific types for json
                    await prisma[seeder.table].delete({
                      where: { [seeder.id]: data[seeder.id] },
                    });
                  }
                  break;
                default:
                  throw new Error(`Unknown seeder type: ${seeder.type}`);
              }
              seed.timestamp = metadata.mtime;
              await prisma.seed.upsert({ where: { filename: file.name }, create: seed, update: seed });
              seeded.push(seed);
              logger.info(`Finished running seeder ${file.name}.`);
            } catch (error) {
              logger.warn(error, `Failed to run seeder ${file.name}.`);
            }
          }
        }
      }
    } catch (error) {
      logger.warn(error);
    }
  }
  if (seeded.length > 0) {
    logger.info(`Finished running the database seeder files.`);
  } else {
    logger.info(`No new database seeder files to run.`);
  }
};

const execute = (options: SeedOptions) => async () => {
  try {
    const seeders = await prisma.seed.findMany({ select: { filename: true, timestamp: true } });
    await seedFiles(options, seeders);
  } catch (error) {
    logger.warn(error);
  }
};

interface SeedState {
  path: string;
}

interface SeedOptions extends ServiceState<SeedState> {}

const task = () => {
  const options: SeedOptions = buildOptions(
    {
      service: "seed",
      schedule: undefined,
      leading: true,
    },
    {
      path: process.env.SEED_DATA_PATH ?? "",
    }
  );
  const worker = execute(options);
  schedule(worker, options);
};

if (!startService(__filename, { name: "Seed Service" })?.catch((error) => logger.warn(error))) {
  task();
}
