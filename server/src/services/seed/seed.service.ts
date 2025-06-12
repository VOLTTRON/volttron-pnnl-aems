import { extname, resolve } from "path";
import { readFile, readdir, stat } from "fs/promises";
import { Seed } from "@prisma/client";
import { chunk, omit } from "lodash";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { BaseService } from "..";
import { PrismaService } from "@/prisma/prisma.service";
import { Timeout } from "@nestjs/schedule";
import { GeographySeeder, Seeder } from ".";
import { AppConfigService } from "@/app.config";
import { NormalizationType, typeofObject } from "@local/common";

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
    @Inject(AppConfigService.Key) configService: AppConfigService,
  ) {
    super("seed", configService);
    this.path = configService.service.seed.dataPath;
  }

  @Timeout(1000)
  execute(): Promise<void> {
    return super.execute();
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
                  | GeographySeeder;
                if (typeofObject<GeographySeeder>(seeder, (v) => typeof v === "object" && "geography" in v)) {
                  for (const { filename } of seeder.data) {
                    const geojson = JSON.parse(
                      await readFile(resolve(file.parentPath, filename), "utf-8"),
                    ) as GeoJSON.FeatureCollection;
                    const collection = geojson.features
                      .filter((feature) =>
                        typeofObject<GeographySeeder["geography"]["geojson"]>(
                          feature,
                          (v) => typeof v === "object" && "properties" in v,
                        ),
                      )
                      .map((feature) => {
                        const type = `${feature.properties[seeder.geography.mapping.type] ?? seeder.geography.defaults?.type ?? ""}`;
                        const group = `${feature.properties[seeder.geography.mapping.group] ?? seeder.geography.defaults?.group ?? ""}`;
                        const name = `${feature.properties[seeder.geography.mapping.name] ?? seeder.geography.defaults?.name ?? ""}`;
                        const id = feature.properties[seeder.geography.mapping.id]
                          ? `${feature.properties[seeder.geography.mapping.id]}`
                          : `${this.normalizer(type)}-${this.normalizer(group)}-${this.normalizer(name)}`;
                        return {
                          id,
                          type,
                          group,
                          name,
                          geojson: feature,
                        };
                      });
                    for (const geographies of chunk(collection, 100)) {
                      await this.prismaService.prisma.geography.createMany({
                        data: geographies,
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
                      // @ts-expect-error: Unable to determine specific types for json
                      await this.prismaService.prisma[seeder.table].createMany({
                        data: seeder.data,
                        skipDuplicates: true,
                      });
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
