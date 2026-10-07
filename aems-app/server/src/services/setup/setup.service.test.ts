jest.mock("node:fs/promises", () => ({ readFile: jest.fn() }));
jest.mock("@/utils/file", () => ({ getConfigFiles: jest.fn() }));

import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { HolidayType, ValidateType } from "@local/common";
import { SetupService } from "./setup.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getConfigFiles } from "@/utils/file";

interface Row {
  id: string;
  name: string;
  campus: string;
  building: string;
  system?: string;
  timezone?: string;
  controlId?: string | null;
  data?: any;
}

/** The files setup can see: path to content, or to an Error the read throws. */
let files: Record<string, string | Error>;
/** Paths whose scan throws, as a missing directory does. */
let unreadablePaths: string[];
let units: Row[];
let controls: Row[];
let failing: Set<string>;
let ids: number;

const thermostat = (campus: string, building: string, system: string, tz = "America/Los_Angeles") =>
  JSON.stringify({ campus, building, system, local_tz: tz });
const ilc = (campus: string, building: string, systems: string[]) => JSON.stringify({ campus, building, systems });

const match = (row: Row, where?: { name?: string | { in: string[] }; id?: string }) =>
  !where ||
  ((where.id === undefined || row.id === where.id) &&
    (where.name === undefined ||
      (typeof where.name === "string" ? row.name === where.name : where.name.in.includes(row.name))));

function fail<T>(key: string, value: () => T): Promise<T> {
  return failing.has(key) ? Promise.reject(new Error(`${key} failed`)) : Promise.resolve().then(value);
}

const prisma = {
  unit: {
    findFirst: jest.fn(({ where }) => fail("unit.findFirst", () => units.find((u) => match(u, where)) ?? null)),
    findMany: jest.fn(() => fail("unit.findMany", () => units.map((u) => ({ ...u })))),
    create: jest.fn(({ data }) =>
      fail("unit.create", () => {
        const row: Row = { id: `u${++ids}`, controlId: null, ...data, data };
        units.push(row);
        return { ...row };
      }),
    ),
    update: jest.fn(({ where, data }) =>
      fail("unit.update", () => {
        const row = units.find((u) => match(u, where))!;
        Object.assign(row, data);
        return { ...row };
      }),
    ),
    updateMany: jest.fn(({ where, data }) =>
      fail("unit.updateMany", () => {
        const rows = units.filter((u) => match(u, where));
        rows.forEach((u) => Object.assign(u, data));
        return { count: rows.length };
      }),
    ),
    deleteMany: jest.fn(({ where }) =>
      fail("unit.deleteMany", () => {
        const before = units.length;
        units = units.filter((u) => !match(u, where));
        return { count: before - units.length };
      }),
    ),
  },
  control: {
    findMany: jest.fn(() =>
      fail("control.findMany", () =>
        controls.map((c) => ({ ...c, units: units.filter((u) => u.controlId === c.id) })),
      ),
    ),
    create: jest.fn(({ data }) =>
      fail("control.create", () => {
        const row: Row = { id: `c${++ids}`, ...data };
        controls.push(row);
        return { ...row, units: [] };
      }),
    ),
    deleteMany: jest.fn(({ where }) =>
      fail("control.deleteMany", () => {
        const before = controls.length;
        controls = controls.filter((c) => !match(c, where));
        return { count: before - controls.length };
      }),
    ),
  },
};

const systems = (rows: Row[]) => rows.map((r) => r.system).sort();

describe("SetupService", () => {
  let module: TestingModule;
  let service: SetupService;
  let warnings: jest.SpyInstance;

  beforeEach(async () => {
    files = {};
    unreadablePaths = [];
    units = [];
    controls = [];
    failing = new Set();
    ids = 0;
    jest.clearAllMocks();
    // The service resolves every path it is given, so the fakes compare resolved paths.
    (getConfigFiles as jest.Mock).mockImplementation((paths: string[], extension: string) => {
      const unreadable = paths.find((p) => unreadablePaths.some((u) => resolve(u) === resolve(p)));
      if (unreadable) return Promise.reject(new Error(`ENOENT: no such file or directory, stat '${unreadable}'`));
      return Promise.resolve(
        Object.keys(files).filter((f) => f.endsWith(extension) && paths.some((p) => resolve(f).startsWith(resolve(p)))),
      );
    });
    (readFile as jest.Mock).mockImplementation((file: string) => {
      const key = Object.keys(files).find((f) => resolve(f) === resolve(file));
      const content = key === undefined ? new Error(`ENOENT: ${file}`) : files[key];
      return content instanceof Error ? Promise.reject(content) : Promise.resolve(content);
    });
    warnings = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);

    module = await Test.createTestingModule({
      providers: [
        SetupService,
        { provide: PrismaService, useValue: { prisma } },
        { provide: SubscriptionService, useValue: { publish: jest.fn().mockResolvedValue(undefined) } },
        {
          provide: AppConfigService.Key,
          useValue: {
            instanceType: "setup",
            service: { setup: { thermostatPaths: ["/t"], ilcPaths: ["/i"] }, synthetic: { campusPrefix: "DEMO_" } },
          },
        },
      ],
    }).compile();
    service = module.get(SetupService);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await module.close();
  });

  // scenario: unit-per-thermostat-file
  it("makes a unit for a thermostat file, named and labelled from its parts, with defaults and its timezone", async () => {
    files["/t/a.config"] = thermostat("PNNL", "ROB", "rtu1", "America/Denver");
    files["/t/b.config"] = thermostat("PNNL", "B1", "Ahu1", "America/Los_Angeles");

    await service.task();

    expect(units).toHaveLength(2);
    const [unit, second] = units;
    expect(unit).toMatchObject({
      campus: "PNNL",
      building: "ROB",
      system: "rtu1",
      timezone: "America/Denver",
      name: "Pnnl-Rob-Rtu_1",
      label: "PNNL ROB rtu1",
    });
    // The claim's named example: PNNL / B1 / Ahu1 -> Pnnl-B_1-Ahu_1.
    expect(second).toMatchObject({
      name: "Pnnl-B_1-Ahu_1",
      label: "PNNL B1 Ahu1",
      timezone: "America/Los_Angeles",
    });
    const configuration = unit.data.configuration.create;
    expect(configuration.setpoint.create).toMatchObject({
      setpoint: ValidateType.Setpoint.options?.default,
      deadband: ValidateType.Deadband.options?.default,
      heating: ValidateType.Heating.options?.default,
      cooling: ValidateType.Cooling.options?.default,
    });
    for (const day of ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "holiday"]) {
      expect(configuration[`${day}Schedule`].create).toEqual(expect.objectContaining({ occupied: expect.any(Boolean) }));
    }
  });

  // scenario: holiday-defaults-and-forms
  it("gives a new unit the thirteen holidays, all enabled but four", async () => {
    files["/t/a.config"] = thermostat("PNNL", "ROB", "rtu1");

    await service.task();

    const holidays = units[0].data.configuration.create.holidays.create as { label: string; type: string }[];
    expect(holidays.map((h) => h.label).sort()).toEqual(HolidayType.values.map((h) => h.label).sort());
    expect(holidays).toHaveLength(13);
    expect(holidays.filter((h) => h.type === "Disabled").map((h) => h.label).sort()).toEqual(
      ["Columbus Day", "Martin Luther King Jr", "Presidents Day", "Veterans Day"],
    );
    expect(holidays.filter((h) => h.type !== "Disabled").every((h) => h.type === "Enabled")).toBe(true);
  });

  // scenario: existing-unit-untouched
  it("leaves an existing unit as it was when its file changes", async () => {
    files["/t/a.config"] = thermostat("PNNL", "ROB", "rtu1", "America/Denver");
    await service.task();
    const before = JSON.stringify(units);

    files["/t/a.config"] = thermostat("PNNL", "ROB", "rtu1", "America/New_York");
    await service.task();

    expect(JSON.stringify(units)).toBe(before);
    expect(prisma.unit.create).toHaveBeenCalledTimes(1);
    expect(prisma.unit.update).not.toHaveBeenCalled();
  });

  // scenario: removed-file-deletes-unit
  it("deletes a unit whose file is gone, and keeps a demo unit", async () => {
    files["/t/a.config"] = thermostat("PNNL", "ROB", "rtu1");
    files["/t/b.config"] = thermostat("PNNL", "ROB", "rtu2");
    await service.task();
    units.push({ id: "demo", name: "DEMO_Campus-B-rtu", campus: "DEMO_Campus", building: "B", system: "demo" });

    delete files["/t/b.config"];
    await service.task();

    expect(systems(units)).toEqual(["demo", "rtu1"]);
  });

  // scenario: control-per-ilc-file
  it("makes one control per ILC file, assigned exactly the units it names, and deletes it when its file goes", async () => {
    for (const system of ["rtu1", "rtu2", "rtu3"]) files[`/t/${system}.config`] = thermostat("PNNL", "ROB", system);
    files["/i/rob.json"] = ilc("PNNL", "ROB", ["rtu1", "rtu2"]);
    await service.task();

    expect(controls).toHaveLength(1);
    const [control] = controls;
    expect(control).toMatchObject({ campus: "PNNL", building: "ROB" });
    const assigned = () => systems(units.filter((u) => u.controlId === control.id));
    expect(assigned()).toEqual(["rtu1", "rtu2"]);

    files["/i/rob.json"] = ilc("PNNL", "ROB", ["rtu2", "rtu3"]);
    await service.task();
    expect(controls).toHaveLength(1);
    expect(assigned()).toEqual(["rtu2", "rtu3"]);

    delete files["/i/rob.json"];
    await service.task();
    expect(controls).toHaveLength(0);
  });

  // scenario: bad-scan-deletes-nothing
  describe("deletes no unit or control after a scan that", () => {
    beforeEach(async () => {
      files["/t/a.config"] = thermostat("PNNL", "ROB", "rtu1");
      files["/t/b.config"] = thermostat("PNNL", "ROB", "rtu2");
      files["/i/rob.json"] = ilc("PNNL", "ROB", ["rtu1", "rtu2"]);
      await service.task();
      expect(units).toHaveLength(2);
      expect(controls).toHaveLength(1);
      warnings.mockClear();
    });

    const holds = async () => {
      await service.task();
      expect(units).toHaveLength(2);
      expect(controls).toHaveLength(1);
      expect(units.every((u) => u.controlId === controls[0].id)).toBe(true);
      expect(prisma.unit.deleteMany).not.toHaveBeenCalled();
      expect(prisma.control.deleteMany).not.toHaveBeenCalled();
      expect(warnings.mock.calls.flat().map(String).join("\n")).toMatch(/delet/i);
    };

    it("found no thermostat file", async () => {
      files = {};
      await holds();
    });

    it("could not read a thermostat path", async () => {
      unreadablePaths = ["/t"];
      delete files["/t/b.config"];
      await holds();
    });

    it("could not read a thermostat file", async () => {
      files["/t/b.config"] = new Error("EACCES: permission denied");
      await holds();
    });

    it("could not parse a thermostat file", async () => {
      files["/t/b.config"] = "{ not json";
      await holds();
    });

    it("could not look a unit up", async () => {
      failing.add("unit.findFirst");
      await holds();
    });

    it("could not list the units", async () => {
      failing.add("unit.findMany");
      delete files["/t/b.config"];
      await holds();
    });

    it("could not list the controls", async () => {
      failing.add("control.findMany");
      delete files["/i/rob.json"];
      await holds();
    });

    it("could not read an ILC path", async () => {
      unreadablePaths = ["/i"];
      await holds();
    });

    it("could not parse an ILC file", async () => {
      files["/i/rob.json"] = "{ not json";
      await holds();
    });
  });

  // scenario: many-buildings-coexist
  it("keeps separate units and controls for two campuses and two buildings", async () => {
    for (const [campus, building] of [
      ["PNNL", "ROB"],
      ["PNNL", "BSF"],
      ["UW", "ROB"],
    ]) {
      for (const system of ["rtu1", "rtu2"]) files[`/t/${campus}-${building}-${system}.config`] = thermostat(campus, building, system);
      files[`/i/${campus}-${building}.json`] = ilc(campus, building, ["rtu1", "rtu2"]);
    }

    await service.task();
    await service.task();

    expect(units).toHaveLength(6);
    expect(controls).toHaveLength(3);
    for (const control of controls) {
      const members = units.filter((u) => u.controlId === control.id);
      expect(systems(members)).toEqual(["rtu1", "rtu2"]);
      expect(members.every((u) => u.campus === control.campus && u.building === control.building)).toBe(true);
    }
  });
});
