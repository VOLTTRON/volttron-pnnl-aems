import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "./config.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { VolttronService } from "../volttron.service";
import { StageType } from "@local/common";

interface Flags {
  serviceOverride?: boolean;
  holidaySchedule?: boolean;
  timezone?: string;
}

const schedule = (occupied = true, startTime = "08:00", endTime = "17:00") => ({
  occupied,
  startTime,
  endTime,
  overridePreStartTime: "06:00",
  overridePreEndTime: "08:00",
  overridePostStartTime: "17:00",
  overridePostEndTime: "19:00",
  override: true,
});

/** A unit as config.service reads it, with whatever its configuration holds overridden. */
function unit(configuration: Record<string, unknown> = {}, timezone: string | null = "America/Los_Angeles") {
  return {
    id: "u1",
    label: "Unit 1",
    system: "RTU1",
    stage: StageType.Update.enum as string,
    timezone,
    location: null,
    configuration: {
      setpoint: { setpoint: 70, deadband: 4, heating: 60, cooling: 80, standbyTime: 30, standbyOffset: 2, overrideSetpoint: 72, overrideDeadband: 6 },
      mondaySchedule: schedule(),
      tuesdaySchedule: schedule(),
      wednesdaySchedule: schedule(),
      thursdaySchedule: schedule(),
      fridaySchedule: schedule(),
      saturdaySchedule: schedule(false),
      sundaySchedule: schedule(false),
      holidaySchedule: schedule(false),
      holidays: [],
      occupancies: [],
      ...configuration,
    },
  };
}

describe("the unit configuration sent to VOLTTRON", () => {
  let module: TestingModule;
  let service: ConfigService;
  let makeApiCall: jest.Mock;
  let units: ReturnType<typeof unit>[];
  let updates: { stage: string; message?: string | null }[];

  async function push(flags: Flags = {}) {
    makeApiCall ??= jest.fn().mockResolvedValue({});
    updates = [];
    module = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: PrismaService,
          useValue: {
            prisma: {
              unit: {
                findMany: jest.fn(({ where }: { where: { stage: { in: string[] } } }) =>
                  Promise.resolve(units.filter((u) => where.stage.in.includes(u.stage))),
                ),
                update: jest.fn(({ data }: { data: { stage: string; message?: string | null } }) => {
                  updates.push(data);
                  return Promise.resolve(null);
                }),
                updateMany: jest.fn().mockResolvedValue({ count: 0 }),
              },
            },
          },
        },
        { provide: SubscriptionService, useValue: { publish: jest.fn().mockResolvedValue(undefined) } },
        {
          provide: AppConfigService.Key,
          useValue: {
            instanceType: "config",
            service: {
              config: {
                startup: false,
                serviceOverride: flags.serviceOverride ?? false,
                holidaySchedule: flags.holidaySchedule ?? false,
              },
            },
            volttron: { timezone: flags.timezone ?? "" },
          },
        },
        { provide: VolttronService, useValue: { makeAuthCall: jest.fn().mockResolvedValue("token"), makeApiCall } },
      ],
    }).compile();
    service = module.get(ConfigService);
    await service.task();
  }

  const sent = (method: string) => makeApiCall.mock.calls.filter((c) => c[1] === method).pop()?.[3] as Record<string, any> | undefined;

  afterEach(async () => {
    jest.useRealTimers();
    await module?.close();
    makeApiCall = undefined as unknown as jest.Mock;
  });

  // scenario: service-windows-gated
  describe("service windows", () => {
    beforeEach(() => {
      units = [unit({ mondaySchedule: { ...schedule(), overridePreStartTime: "06:00", overridePreEndTime: "06:00", overridePostStartTime: "00:00", overridePostEndTime: "24:00" } })];
    });

    it("are not sent while SERVICE_CONFIG_SERVICE_OVERRIDE is off", async () => {
      await push({ serviceOverride: false });
      expect(sent("set_service_schedule")).toBeUndefined();
      expect(sent("set_temperature_setpoints")).not.toHaveProperty("ServiceSetPoint");
      expect(sent("set_temperature_setpoints")).not.toHaveProperty("ServiceDeadBand");
    });

    it("are sent while it is on, an empty window as always_off and 00:00-24:00 as always_on", async () => {
      await push({ serviceOverride: true });
      expect(sent("set_service_schedule")?.Monday).toEqual({ pre: "always_off", post: "always_on" });
      expect(sent("set_service_schedule")?.Tuesday).toEqual({ pre: { start: "06:00", end: "08:00" }, post: { start: "17:00", end: "19:00" } });
      expect(sent("set_temperature_setpoints")).toMatchObject({ ServiceSetPoint: 72 });
    });

    it("never carry the editor's override switch", async () => {
      await push({ serviceOverride: true, holidaySchedule: true });
      expect(JSON.stringify(makeApiCall.mock.calls.map((c) => c[3]))).not.toMatch(/"override"/);
    });
  });

  // scenario: holiday-defaults-and-forms
  it("sends no disabled holiday, an enabled one by its label, and a custom one with its month, day and observance", async () => {
    units = [
      unit({
        holidays: [
          { label: "Christmas", type: "Enabled" },
          { label: "Columbus Day", type: "Disabled" },
          { label: "Founders Day", type: "Custom", month: 3, day: 4, observance: "nearest_workday" },
        ],
      }),
    ];
    await push();
    expect(sent("set_holidays")).toEqual({
      Christmas: {},
      "Founders Day": { month: 3, day: 4, observance: "nearest_workday" },
    });
  });

  // scenario: observance-sent-as-name
  describe("a custom holiday", () => {
    it.each(["nearest_workday", "Nearest Workday"])("stored with observance %p is sent with its name", async (observance) => {
      units = [unit({ holidays: [{ label: "Founders Day", type: "Custom", month: 3, day: 4, observance }] })];
      await push();
      expect(sent("set_holidays")?.["Founders Day"]).toEqual({ month: 3, day: 4, observance: "nearest_workday" });
    });

    it("schedule is sent only while SERVICE_CONFIG_HOLIDAY_SCHEDULE is on", async () => {
      units = [unit()];
      await push({ serviceOverride: true, holidaySchedule: false });
      expect(sent("set_schedule")).not.toHaveProperty("Holiday");
      expect(sent("set_service_schedule")).not.toHaveProperty("Holiday");
      await module.close();
      await push({ serviceOverride: true, holidaySchedule: true });
      expect(sent("set_schedule")).toHaveProperty("Holiday", "always_off");
      expect(sent("set_service_schedule")).toHaveProperty("Holiday");
    });
  });

  // scenario: occupancies-from-today
  describe("occupancies", () => {
    // 03:00 UTC on 10 March is still 9 March in Los Angeles and already 10 March in Tokyo. Dates are
    // stored at noon UTC, as the client writes them.
    const at = (day: string, occupied = true) => ({ date: new Date(`${day}T12:00:00Z`), schedule: schedule(occupied) });
    const occupancies = [at("2026-03-08"), at("2026-03-09"), at("2026-03-10"), at("2026-03-10", false)];
    beforeEach(() => {
      jest.useFakeTimers({ now: new Date("2026-03-10T03:00:00Z"), doNotFake: ["nextTick", "setImmediate", "setTimeout", "setInterval", "queueMicrotask"] });
    });

    it("are sent from today in the unit's timezone, those sharing a date together", async () => {
      units = [unit({ occupancies })];
      await push({ timezone: "Asia/Tokyo" });
      expect(sent("set_occupancy_override")).toEqual({
        "2026-03-09": [{ start: "08:00", end: "17:00" }],
        "2026-03-10": [{ start: "08:00", end: "17:00" }, "always_off"],
      });
    });

    it("are sent from today in VOLTTRON_TIMEZONE when the unit has none", async () => {
      units = [unit({ occupancies }, null)];
      await push({ timezone: "Asia/Tokyo" });
      expect(Object.keys(sent("set_occupancy_override") ?? {})).toEqual(["2026-03-10"]);
    });
  });

  const methods = () => makeApiCall.mock.calls.map((c) => c[1] as string);

  // scenario: unit-push-sequence
  it("moves a unit to Process, makes the eight calls to manager.<system> in order, then moves it to Complete", async () => {
    units = [unit()];
    await push({ serviceOverride: true });
    expect(methods()).toEqual([
      "set_temperature_setpoints",
      "set_occupancy_override",
      "set_holidays",
      "set_schedule",
      "set_service_schedule",
      "set_optimal_start",
      "set_configurations",
      "set_location",
    ]);
    expect(new Set(makeApiCall.mock.calls.map((c) => c[0]))).toEqual(new Set(["manager.rtu1"]));
    expect(updates.map((u) => u.stage)).toEqual([StageType.Process.enum, StageType.Complete.enum]);
  });

  // scenario: unit-push-fail-message
  describe("a failed call", () => {
    const failing = (method: string, message: string) =>
      jest.fn((_id: string, m: string) => (m === method ? Promise.reject(new Error(message)) : Promise.resolve({})));

    it("moves the unit to Fail with the error cut to 1024 characters, and stops the push", async () => {
      units = [unit()];
      makeApiCall = failing("set_holidays", "y".repeat(2000));
      await push({ serviceOverride: true });
      expect(methods()).toEqual(["set_temperature_setpoints", "set_occupancy_override", "set_holidays"]);
      expect(updates.map((u) => u.stage)).toEqual([StageType.Process.enum, StageType.Fail.enum]);
      expect(updates[1].message).toHaveLength(1024);
    });

    it("to set_service_schedule is only logged, and the push carries on to Complete", async () => {
      units = [unit()];
      makeApiCall = failing("set_service_schedule", "service schedule refused");
      await push({ serviceOverride: true });
      expect(methods()).toContain("set_location");
      expect(updates.map((u) => u.stage)).toEqual([StageType.Process.enum, StageType.Complete.enum]);
    });
  });

  // scenario: fail-not-retried
  it("leaves a unit in Fail alone", async () => {
    units = [{ ...unit(), stage: StageType.Fail.enum }];
    await push();
    expect(makeApiCall).not.toHaveBeenCalled();
    expect(updates).toEqual([]);
  });
});
