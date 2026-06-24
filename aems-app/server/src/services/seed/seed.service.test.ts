jest.mock("fs/promises", () => ({
  readdir: jest.fn(),
  stat: jest.fn(),
  readFile: jest.fn(),
}));

jest.mock("@/utils/json", () => ({
  StreamingJsonReader: jest.fn(),
}));

import { readdir, stat, readFile } from "fs/promises";
import { StreamingJsonReader } from "@/utils/json";
import { SeedService } from "./seed.service";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
import { FileSeeder, GeographySeeder, Seeder } from ".";

const mockReaddir = readdir as jest.MockedFunction<typeof readdir>;
const mockStat = stat as jest.MockedFunction<typeof stat>;
const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
const MockStreamingJsonReader = StreamingJsonReader as jest.MockedClass<typeof StreamingJsonReader>;

function makeConfig(): AppConfigService {
  return {
    instanceType: "seed",
    service: {
      seed: {
        dataPath: "./seeds",
        batchSize: 0,
      },
    },
  } as unknown as AppConfigService;
}

function makePrisma(tableOverrides: Record<string, any> = {}): PrismaService {
  const base: Record<string, any> = {
    seed: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue({ filename: "test.json", timestamp: new Date() }),
    },
    user: {
      upsert: jest.fn().mockResolvedValue({ id: "u1" }),
      create: jest.fn().mockResolvedValue({ id: "u1" }),
      update: jest.fn().mockResolvedValue({ id: "u1" }),
      delete: jest.fn().mockResolvedValue({ id: "u1" }),
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  return {
    prisma: { ...base, ...tableOverrides },
  } as unknown as PrismaService;
}

function makeDirent(name: string, isFile = true): any {
  return {
    name,
    isFile: () => isFile,
    parentPath: "/app/seeds",
  };
}

function makeStatResult(mtime: Date = new Date("2026-01-01")): any {
  return { mtime };
}

function makeSeeder(type: Seeder["type"], data: Record<string, any>[] = []): Seeder {
  return { type, table: "user" as any, id: "id", data };
}

describe("SeedService.task", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does nothing when no JSON files are found", async () => {
    const prisma = makePrisma();
    mockReaddir.mockResolvedValue([makeDirent("readme.txt"), makeDirent("subdir", false)]);

    const service = new SeedService(prisma, makeConfig());
    await service.task();

    expect(prisma.prisma.seed.upsert).not.toHaveBeenCalled();
  });

  it("skips files whose mtime has not changed since last seed", async () => {
    const seedTimestamp = new Date("2026-06-01");
    const prisma = makePrisma({
      seed: {
        findMany: jest.fn().mockResolvedValue([{ filename: "users.json", timestamp: seedTimestamp }]),
        upsert: jest.fn(),
      },
    });

    mockReaddir.mockResolvedValue([makeDirent("users.json")]);
    mockStat.mockResolvedValue(makeStatResult(new Date("2026-05-01")));

    const service = new SeedService(prisma, makeConfig());
    await service.task();

    expect(mockReadFile).not.toHaveBeenCalled();
    expect(prisma.prisma.seed.upsert).not.toHaveBeenCalled();
  });

  it("processes a file when mtime is newer than last seed", async () => {
    const prisma = makePrisma();
    const seeder = makeSeeder("upsert", [{ id: "u1", name: "Alice" }]);

    mockReaddir.mockResolvedValue([makeDirent("users.json")]);
    mockStat.mockResolvedValue(makeStatResult(new Date("2026-06-17")));
    mockReadFile.mockResolvedValue(JSON.stringify(seeder) as any);

    const service = new SeedService(prisma, makeConfig());
    await service.task();

    expect(prisma.prisma.user.upsert).toHaveBeenCalled();
    expect(prisma.prisma.seed.upsert).toHaveBeenCalled();
  });

  it("calls upsert with correct args for upsert seeder type", async () => {
    const prisma = makePrisma();
    const seeder = makeSeeder("upsert", [{ id: "u1", name: "Alice" }]);

    mockReaddir.mockResolvedValue([makeDirent("users.json")]);
    mockStat.mockResolvedValue(makeStatResult(new Date("2026-06-17")));
    mockReadFile.mockResolvedValue(JSON.stringify(seeder) as any);

    const service = new SeedService(prisma, makeConfig());
    await service.task();

    expect(prisma.prisma.user.upsert).toHaveBeenCalledWith({
      where: { id: "u1" },
      update: { name: "Alice" },
      create: { id: "u1", name: "Alice" },
    });
  });

  it("calls create for each record in create seeder type with batchSize=0", async () => {
    const prisma = makePrisma();
    const seeder = makeSeeder("create", [{ id: "u1" }, { id: "u2" }]);

    mockReaddir.mockResolvedValue([makeDirent("users.json")]);
    mockStat.mockResolvedValue(makeStatResult(new Date("2026-06-17")));
    mockReadFile.mockResolvedValue(JSON.stringify(seeder) as any);

    const service = new SeedService(prisma, makeConfig());
    await service.task();

    expect(prisma.prisma.user.create).toHaveBeenCalledTimes(2);
  });

  it("calls createMany when batchSize > 0 for create seeder type", async () => {
    const config = {
      ...makeConfig(),
      service: { seed: { dataPath: "./seeds", batchSize: 10 } },
    } as unknown as AppConfigService;

    const prisma = makePrisma();
    const seeder = makeSeeder("create", [{ id: "u1" }, { id: "u2" }]);

    mockReaddir.mockResolvedValue([makeDirent("users.json")]);
    mockStat.mockResolvedValue(makeStatResult(new Date("2026-06-17")));
    mockReadFile.mockResolvedValue(JSON.stringify(seeder) as any);

    const service = new SeedService(prisma, config);
    await service.task();

    expect(prisma.prisma.user.createMany).toHaveBeenCalled();
  });

  it("calls update for each record in update seeder type", async () => {
    const prisma = makePrisma();
    const seeder = makeSeeder("update", [{ id: "u1", name: "Bob" }]);

    mockReaddir.mockResolvedValue([makeDirent("users.json")]);
    mockStat.mockResolvedValue(makeStatResult(new Date("2026-06-17")));
    mockReadFile.mockResolvedValue(JSON.stringify(seeder) as any);

    const service = new SeedService(prisma, makeConfig());
    await service.task();

    expect(prisma.prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { name: "Bob" },
    });
  });

  it("calls delete for each record in delete seeder type", async () => {
    const prisma = makePrisma();
    const seeder = makeSeeder("delete", [{ id: "u1" }]);

    mockReaddir.mockResolvedValue([makeDirent("users.json")]);
    mockStat.mockResolvedValue(makeStatResult(new Date("2026-06-17")));
    mockReadFile.mockResolvedValue(JSON.stringify(seeder) as any);

    const service = new SeedService(prisma, makeConfig());
    await service.task();

    expect(prisma.prisma.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("logs a warning and continues when a seeder file fails to parse", async () => {
    const prisma = makePrisma();

    mockReaddir.mockResolvedValue([makeDirent("bad.json")]);
    mockStat.mockResolvedValue(makeStatResult(new Date("2026-06-17")));
    mockReadFile.mockResolvedValue("not valid json" as any);

    const service = new SeedService(prisma, makeConfig());

    await expect(service.task()).resolves.not.toThrow();
    expect(prisma.prisma.seed.upsert).not.toHaveBeenCalled();
  });

  it("processes FileSeeder using StreamingJsonReader", async () => {
    const prisma = makePrisma();
    const fileSeeder = {
      type: "upsert",
      table: "user",
      id: "id",
      jsonpath: "$.items[]",
      data: [{ filename: "large.json" }],
    };

    const record = { id: "u1", name: "Alice" };
    MockStreamingJsonReader.mockImplementation(
      () =>
        ({
          read: async function* () {
            yield record;
          },
        }) as any,
    );

    mockReaddir.mockResolvedValue([makeDirent("users.json")]);
    mockStat.mockResolvedValue(makeStatResult(new Date("2026-06-17")));
    mockReadFile.mockResolvedValue(JSON.stringify(fileSeeder) as any);

    const service = new SeedService(prisma, makeConfig());
    await service.task();

    expect(MockStreamingJsonReader).toHaveBeenCalled();
    expect(prisma.prisma.user.upsert).toHaveBeenCalled();
  });

  it("processes multiple files in one run", async () => {
    const prisma = makePrisma();
    const seeder1 = makeSeeder("upsert", [{ id: "u1" }]);
    const seeder2 = makeSeeder("create", [{ id: "u2" }]);

    mockReaddir.mockResolvedValue([makeDirent("file1.json"), makeDirent("file2.json")]);
    mockStat.mockResolvedValue(makeStatResult(new Date("2026-06-17")));
    mockReadFile
      .mockResolvedValueOnce(JSON.stringify(seeder1) as any)
      .mockResolvedValueOnce(JSON.stringify(seeder2) as any);

    const service = new SeedService(prisma, makeConfig());
    await service.task();

    expect(prisma.prisma.seed.upsert).toHaveBeenCalledTimes(2);
  });

  it("flushes remaining batch when records don't divide evenly by batchSize", async () => {
    const config = {
      ...makeConfig(),
      service: { seed: { dataPath: "./seeds", batchSize: 3 } },
    } as unknown as AppConfigService;

    const prisma = makePrisma();
    const fileSeeder: FileSeeder = {
      type: "create",
      table: "user" as any,
      id: "id",
      jsonpath: "$.items[]",
      data: [{ filename: "large.json" }],
    };

    const records = [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }];
    MockStreamingJsonReader.mockImplementation(
      () =>
        ({
          read: async function* () {
            for (const r of records) yield r;
          },
        }) as any,
    );

    mockReaddir.mockResolvedValue([makeDirent("users.json")]);
    mockStat.mockResolvedValue(makeStatResult(new Date("2026-06-17")));
    mockReadFile.mockResolvedValue(JSON.stringify(fileSeeder) as any);

    const service = new SeedService(prisma, config);
    await service.task();

    // First createMany called with full batch of 3, second with remainder of 2
    expect(prisma.prisma.user.createMany).toHaveBeenCalledTimes(2);
    expect(prisma.prisma.user.createMany).toHaveBeenNthCalledWith(1, {
      data: [{ id: "1" }, { id: "2" }, { id: "3" }],
      skipDuplicates: true,
    });
    expect(prisma.prisma.user.createMany).toHaveBeenNthCalledWith(2, {
      data: [{ id: "4" }, { id: "5" }],
      skipDuplicates: true,
    });
  });

  it("transforms GeoJSON features using geography mapping", async () => {
    const prisma = makePrisma({
      geography: {
        upsert: jest.fn().mockResolvedValue({ id: "geo1" }),
      },
    });

    const geographySeeder: GeographySeeder = {
      type: "upsert",
      table: "geography",
      id: "id",
      jsonpath: "$.features[]",
      data: [{ filename: "regions.json" }],
      geography: {
        mapping: { id: "id", name: "name", group: "group", type: "type" },
        defaults: { type: "region" },
        geojson: { properties: {}, geometry: { type: "Polygon", coordinates: [] } },
      },
    };

    const feature: GeoJSON.Feature = {
      type: "Feature",
      properties: {
        type: "county",
        group: "northwest",
        name: "King County",
        id: "king-county",
      },
      geometry: { type: "Polygon", coordinates: [] },
    };

    MockStreamingJsonReader.mockImplementation(
      () =>
        ({
          read: async function* () {
            yield feature;
          },
        }) as any,
    );

    mockReaddir.mockResolvedValue([makeDirent("regions.json")]);
    mockStat.mockResolvedValue(makeStatResult(new Date("2026-06-17")));
    mockReadFile.mockResolvedValue(JSON.stringify(geographySeeder) as any);

    const service = new SeedService(prisma, makeConfig());
    await service.task();

    expect(prisma.prisma.geography.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "king-county" },
        create: expect.objectContaining({
          id: "king-county",
          type: "county",
          group: "northwest",
          name: "King County",
          geojson: feature,
        }),
      }),
    );
  });

  it("generates id from normalized type-group-name when id property is absent from feature", async () => {
    const prisma = makePrisma({
      geography: {
        upsert: jest.fn().mockResolvedValue({ id: "generated" }),
      },
    });

    // Use default GeographySeeder mapping (id="id") but don't include "id" in properties
    const geographySeeder: GeographySeeder = {
      type: "upsert",
      table: "geography",
      id: "id",
      jsonpath: "$.features[]",
      data: [{ filename: "regions.json" }],
      geography: {
        mapping: { id: "id", name: "name", group: "group", type: "type" },
        defaults: {},
        geojson: { properties: {}, geometry: { type: "Point", coordinates: [] } },
      },
    };

    const feature: GeoJSON.Feature = {
      type: "Feature",
      // no "id" property — id should be generated from type-group-name
      properties: { type: "State", group: "West", name: "Washington" },
      geometry: { type: "Point", coordinates: [] },
    };

    MockStreamingJsonReader.mockImplementation(
      () =>
        ({
          read: async function* () {
            yield feature;
          },
        }) as any,
    );

    mockReaddir.mockResolvedValue([makeDirent("regions.json")]);
    mockStat.mockResolvedValue(makeStatResult(new Date("2026-06-17")));
    mockReadFile.mockResolvedValue(JSON.stringify(geographySeeder) as any);

    const service = new SeedService(prisma, makeConfig());
    await service.task();

    // id should be normalizer(type)-normalizer(group)-normalizer(name)
    const call = (prisma.prisma.geography.upsert as jest.Mock).mock.calls[0][0];
    expect(call.create.id).toMatch(/^state-west-washington$/);
  });
});
