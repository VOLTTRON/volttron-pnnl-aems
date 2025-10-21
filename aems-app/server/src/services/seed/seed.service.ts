import { extname, resolve } from "path";
import { readFile, readdir, stat } from "fs/promises";
import { Seed } from "@prisma/client";
import { chunk, omit } from "lodash";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { BaseService } from "..";
import { PrismaService } from "@/prisma/prisma.service";
import { Timeout } from "@nestjs/schedule";
import { FileSeeder, GeographySeeder, Seeder } from ".";
import { AppConfigService } from "@/app.config";
import { NormalizationType, typeofObject } from "@local/common";
import { StreamingJsonReader } from "@/utils/json";

@Injectable()
export class SeedService extends BaseService {
  private logger = new Logger(SeedService.name);
  private readonly normalizer = NormalizationType.process(
    NormalizationType.NFD,
    NormalizationType.Lowercase,
    NormalizationType.Concatenate,
    NormalizationType.Letters,
    NormalizationType.Numbers,
  );
  private readonly path;

  constructor(
    private prismaService: PrismaService,
    @Inject(AppConfigService.Key) private configService: AppConfigService,
  ) {
    super("seed", configService);
    this.path = configService.service.seed.dataPath;
  }

  @Timeout(1000)
  async execute(): Promise<void> {
    await super.execute();
  }

  async task() {
    const seeders = await this.prismaService.prisma.seed.findMany({ select: { filename: true, timestamp: true } });
    const seeded: Pick<Seed, "filename" | "timestamp">[] = [];
    const files = await readdir(resolve(process.cwd(), this.path), { withFileTypes: true });
    this.logger.log(`Running the database seeder files...`);
    for (const file of files) {
      try {
        const ext = extname(file.name);
        if (/\.json/i.test(ext)) {
          if (file.isFile()) {
            const metadata = await stat(resolve(process.cwd(), this.path, file.name));
            const seed = seeders.find((v) => v.filename === file.name) ?? {
              filename: file.name,
              timestamp: new Date(0),
            };
            if (metadata.mtime > seed.timestamp) {
              this.logger.log(`Running seeder ${file.name}...`);
              try {
                const seeder = JSON.parse(await readFile(resolve(file.parentPath, file.name), "utf-8")) as
                  | Seeder
                  | FileSeeder
                  | GeographySeeder;
                if (typeofObject<FileSeeder>(seeder, (v) => typeof v === "object" && "jsonpath" in v)) {
                  const geography = typeofObject<GeographySeeder>(
                    seeder,
                    (v) => typeof v === "object" && "geography" in v,
                  )
                    ? seeder["geography"]
                    : undefined;
                  for (const { filename } of seeder.data) {
                    const reader = new StreamingJsonReader(resolve(file.parentPath, filename));
                    let batch: Record<string, any>[] = [];
                    for await (let record of reader.read<Record<string, any>>(seeder.jsonpath)) {
                      if (
                        geography &&
                        typeofObject<GeoJSON.Feature>(record, (v) => typeof v === "object" && "properties" in v)
                      ) {
                        const type = `${record.properties?.[geography.mapping.type] ?? geography.defaults?.type ?? ""}`;
                        const group = `${record.properties?.[geography.mapping.group] ?? geography.defaults?.group ?? ""}`;
                        const name = `${record.properties?.[geography.mapping.name] ?? geography.defaults?.name ?? ""}`;
                        const id = record.properties?.[geography.mapping.id]
                          ? `${record.properties?.[geography.mapping.id]}`
                          : `${this.normalizer(type)}-${this.normalizer(group)}-${this.normalizer(name)}`;
                        record = { id, type, group, name, geojson: record };
                      }
                      switch (seeder.type) {
                        case "upsert":
                          // @ts-expect-error: Unable to determine specific types for json
                          await this.prismaService.prisma[seeder.table].upsert({
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            where: { [seeder.id]: record[seeder.id] },
                            update: omit(record, [seeder.id]),
                            create: record,
                          });
                          break;
                        case "create":
                          if (this.configService.service.seed.batchSize > 0) {
                            batch.push(record);
                            if (batch.length >= this.configService.service.seed.batchSize) {
                              // @ts-expect-error: Unable to determine specific types for json
                              await this.prismaService.prisma[seeder.table].createMany({
                                data: batch,
                                skipDuplicates: true,
                              });
                              batch = [];
                            }
                          } else {
                            // @ts-expect-error: Unable to determine specific types for json
                            await this.prismaService.prisma[seeder.table].create({
                              data: record,
                            });
                          }
                          break;
                        case "delete":
                          // @ts-expect-error: Unable to determine specific types for json
                          await this.prismaService.prisma[seeder.table].delete({
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            where: { [seeder.id]: record[seeder.id] },
                          });
                          break;
                        case "update":
                          // @ts-expect-error: Unable to determine specific types for json
                          await this.prismaService.prisma[seeder.table].update({
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            where: { [seeder.id]: record[seeder.id] },
                            data: omit(record, [seeder.id]),
                          });
                          break;
                        default:
                          throw new Error(`Unknown or unsupported seeder type: ${seeder as any}`);
                      }
                    }
                    if (batch.length > 0) {
                      // @ts-expect-error: Unable to determine specific types for json
                      await this.prismaService.prisma[seeder.table].createMany({
                        data: batch,
                        skipDuplicates: true,
                      });
                    }
                  }
                } else {
                  switch (seeder.type) {
                    case "upsert":
                      for (const data of seeder.data) {
                        // @ts-expect-error: Unable to determine specific types for json
                        await this.prismaService.prisma[seeder.table].upsert({
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                          where: { [seeder.id]: data[seeder.id] },
                          update: omit(data, [seeder.id]),
                          create: data,
                        });
                      }
                      break;
                    case "create":
                      if (this.configService.service.seed.batchSize > 0) {
                        for (const records of chunk(seeder.data, this.configService.service.seed.batchSize)) {
                          // @ts-expect-error: Unable to determine specific types for json
                          await this.prismaService.prisma[seeder.table].createMany({
                            data: records,
                            skipDuplicates: true,
                          });
                        }
                      } else {
                        for (const data of seeder.data) {
                          // @ts-expect-error: Unable to determine specific types for json
                          await this.prismaService.prisma[seeder.table].create({
                            data,
                          });
                        }
                      }
                      break;
                    case "update":
                      for (const data of seeder.data) {
                        // @ts-expect-error: Unable to determine specific types for json
                        await this.prismaService.prisma[seeder.table].update({
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                          where: { [seeder.id]: data[seeder.id] },
                          data: omit(data, [seeder.id]),
                        });
                      }
                      break;
                    case "delete":
                      for (const data of seeder.data) {
                        // @ts-expect-error: Unable to determine specific types for json
                        await this.prismaService.prisma[seeder.table].delete({
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                          where: { [seeder.id]: data[seeder.id] },
                        });
                      }
                      break;
                    default:
                      throw new Error(`Unknown or unsupported seeder type: ${seeder as any}`);
                  }
                }
                seed.timestamp = metadata.mtime;
                await this.prismaService.prisma.seed.upsert({
                  where: { filename: file.name },
                  create: seed,
                  update: seed,
                });
                seeded.push(seed);
                this.logger.log(`Finished running seeder ${file.name}.`);
              } catch (error) {
                this.logger.warn(error, `Failed to run seeder ${file.name}.`);
              }
            }
          }
        }
      } catch (error) {
        this.logger.warn(error);
      }
    }
    if (seeded.length > 0) {
      this.logger.log(`Finished running the database seeder files.`);
    } else {
      this.logger.log(`No new database seeder files to run.`);
    }
  }
}
