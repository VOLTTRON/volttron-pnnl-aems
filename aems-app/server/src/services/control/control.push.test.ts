import { Test, TestingModule } from "@nestjs/testing";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { StageType } from "@local/common";
import { ControlService } from "./control.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { VolttronService } from "../volttron.service";

interface Control {
  id: string;
  label: string;
  campus: string;
  building: string;
  stage: string;
  peakLoadExclude: boolean;
  units: { system: string; peakLoadExclude: boolean }[];
}

const control = (overrides: Partial<Control> = {}): Control => ({
  id: "c1",
  label: "PNNL ROB",
  campus: "PNNL",
  building: "ROB",
  stage: StageType.Update.enum,
  peakLoadExclude: false,
  units: [
    { system: "rtu1", peakLoadExclude: false },
    { system: "rtu2", peakLoadExclude: false },
  ],
  ...overrides,
});

describe("pushing a control to the ILC agent", () => {
  let module: TestingModule;
  let templates: string;
  let controls: Control[];
  let updates: { id: string; stage: string; message?: string | null }[];
  let makeApiCall: jest.Mock;

  beforeEach(() => {
    templates = mkdtempSync(join(tmpdir(), "ilc-templates-"));
    writeFileSync(join(templates, "control.json"), JSON.stringify({ "{campus}": { units: { _type: "map", path: "units", value: "{system}" } } }));
    writeFileSync(join(templates, "building.json"), JSON.stringify({ name: "{building}" }));
    writeFileSync(join(templates, "notes.txt"), "not a template");
    updates = [];
    makeApiCall = jest.fn().mockResolvedValue({});
  });

  afterEach(async () => {
    await module?.close();
    rmSync(templates, { recursive: true, force: true });
  });

  type Stage = { stage: string; message?: string | null };
  type Where = { id?: string; stage?: string | { in: string[] } };
  const matches = (c: Control, where: Where) =>
    (where.id === undefined || c.id === where.id) &&
    (where.stage === undefined || (typeof where.stage === "string" ? c.stage === where.stage : where.stage.in.includes(c.stage)));
  /** Applies DATA to the controls WHERE matches, recording it if any did; the number written. */
  function write(where: Where, data: Stage) {
    const rows = controls.filter((c) => matches(c, where));
    rows.forEach((c) => {
      Object.assign(c, data);
      updates.push({ id: c.id, ...data });
    });
    return rows.length;
  }

  async function push(templatePaths = [templates]) {
    module = await Test.createTestingModule({
      providers: [
        ControlService,
        {
          provide: PrismaService,
          useValue: {
            prisma: {
              // A table of CONTROLS: a write applies to the rows its WHERE (id, and stage or stages) matches.
              control: {
                findMany: jest.fn(({ where }: { where: Where }) => Promise.resolve(controls.filter((c) => matches(c, where)).map((c) => structuredClone(c)))),
                findUnique: jest.fn(({ where }: { where: Where }) => {
                  const found = controls.find((c) => matches(c, where));
                  return Promise.resolve(found ? structuredClone(found) : null);
                }),
                update: jest.fn(({ where, data }: { where: Where; data: Stage }) => Promise.resolve(write(where, data))),
                updateMany: jest.fn(({ where, data }: { where: Where; data: Stage }) => Promise.resolve({ count: write(where, data) })),
              },
            },
          },
        },
        { provide: SubscriptionService, useValue: { publish: jest.fn().mockResolvedValue(undefined) } },
        { provide: AppConfigService.Key, useValue: { instanceType: "control", service: { control: { templatePaths } } } },
        { provide: VolttronService, useValue: { makeAuthCall: jest.fn().mockResolvedValue("token"), makeApiCall } },
      ],
    }).compile();
    await module.get(ControlService).task();
  }

  const sent = () => makeApiCall.mock.calls.filter((c) => c[0] === "agent.ilc" && c[1] === "update_configurations").map((c) => c[3]);
  const stages = () => updates.map((u) => u.stage);
  const failure = () => updates.find((u) => u.stage === StageType.Fail.enum)?.message ?? "";

  // scenario: ilc-push-renders-templates
  it("renders every .json template with the control and its units, sent to agent.ilc keyed by file name", async () => {
    controls = [control()];
    await push();
    expect(sent()).toEqual([{ control: { PNNL: { units: ["rtu1", "rtu2"] } }, building: { name: "ROB" } }]);
  });

  // scenario: ilc-push-stages
  describe("stages", () => {
    it("moves the control to Process, then to Complete", async () => {
      controls = [control()];
      await push();
      expect(stages()).toEqual([StageType.Process.enum, StageType.Complete.enum]);
    });

    it("moves it to Fail on failure, with the error cut to 1024 characters", async () => {
      controls = [control()];
      makeApiCall.mockRejectedValue(new Error("x".repeat(2000)));
      await push();
      expect(stages()).toEqual([StageType.Process.enum, StageType.Fail.enum]);
      expect(failure()).toHaveLength(1024);
      expect(failure().startsWith("xxx")).toBe(true);
    });
  });

  // scenario: ilc-render-error-sends-nothing
  describe("fails and sends nothing", () => {
    beforeEach(() => (controls = [control()]));

    it("when templates fail to parse, listing every error", async () => {
      writeFileSync(join(templates, "broken-a.json"), "{ not json");
      writeFileSync(join(templates, "broken-b.json"), "[1, 2,");
      await push();
      expect(sent()).toEqual([]);
      expect(stages()).toEqual([StageType.Process.enum, StageType.Fail.enum]);
      expect(failure()).toMatch(/2 error/);
      expect(failure().match(/\[parse\]/g)).toHaveLength(2);
    });

    it("when a template fails to render", async () => {
      writeFileSync(join(templates, "bad.json"), JSON.stringify({ x: { _type: "evaluate", sources: ["campus"], expression: "campus", values: {} } }));
      await push();
      expect(sent()).toEqual([]);
      expect(failure()).toMatch(/\[evaluate\]/);
    });

    it("when none of the template paths exist", async () => {
      await push([join(templates, "missing"), join(templates, "also-missing")]);
      expect(sent()).toEqual([]);
      expect(failure()).toMatch(/None of the configured ILC template paths exist/);
    });

    it("when no template path is configured", async () => {
      await push([]);
      expect(sent()).toEqual([]);
      expect(stages()).toEqual([StageType.Process.enum, StageType.Fail.enum]);
    });
  });

  // scenario: unit-participation-honoured
  describe("grid-service participation", () => {
    it("leaves a unit that does not participate out of its control's configuration", async () => {
      controls = [control({ units: [{ system: "rtu1", peakLoadExclude: false }, { system: "rtu2", peakLoadExclude: true }] })];
      await push();
      expect(sent()[0]).toMatchObject({ control: { PNNL: { units: ["rtu1"] } } });
    });

    it("sends a control that does not participate with no units", async () => {
      controls = [control({ peakLoadExclude: true })];
      await push();
      expect(sent()[0]).toMatchObject({ control: { PNNL: { units: [] } } });
    });
  });

  // scenario: fail-not-retried
  it("leaves a control in Fail alone", async () => {
    controls = [control({ stage: StageType.Fail.enum })];
    await push();
    expect(sent()).toEqual([]);
    expect(updates).toEqual([]);
  });

  // scenario: new-control-pushed
  it("pushes a control setup has just created, with no edit", async () => {
    controls = [control({ stage: StageType.Create.enum })];
    await push();
    expect(sent()).toHaveLength(1);
    expect(stages()).toEqual([StageType.Process.enum, StageType.Complete.enum]);
  });

  // scenario: edit-during-push-repushed
  it("does not mark Complete a control edited while it was being pushed, and the next push sends the edit", async () => {
    controls = [control()];
    makeApiCall = jest.fn(() => {
      if (controls[0].stage === StageType.Process.enum && controls[0].units.length === 2) {
        controls[0].units = [{ system: "rtu1", peakLoadExclude: false }];
        controls[0].stage = StageType.Update.enum;
      }
      return Promise.resolve({});
    });
    await push();
    expect(controls[0].stage).toBe(StageType.Update.enum);
    expect(stages()).not.toContain(StageType.Complete.enum);

    await module.close();
    await push();
    expect(sent().pop()).toMatchObject({ control: { PNNL: { units: ["rtu1"] } } });
    expect(controls[0].stage).toBe(StageType.Complete.enum);
  });
});
