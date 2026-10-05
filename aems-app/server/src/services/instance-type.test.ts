import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { Test } from "@nestjs/testing";
import { SchedulerRegistry } from "@nestjs/schedule";
import { BaseService } from ".";
import { ServicesModule } from "./services.module";

class Probe extends BaseService {
  ran = 0;
  constructor(name: string, instanceType: string | undefined) {
    super(name, { instanceType: instanceType ?? "" } as AppConfigService);
  }
  async task() {
    this.ran++;
  }
}

/** Which of these services run under INSTANCE_TYPE. */
async function running(instanceType: string | undefined, names: string[]) {
  const out: string[] = [];
  for (const name of names) {
    const probe = new Probe(name, instanceType);
    await probe.execute();
    if (probe.ran) out.push(name);
  }
  return out;
}

describe("INSTANCE_TYPE", () => {
  const names = ["seed", "log", "config", "synth"];

  // scenario: instance-type-grammar
  it("runs all for *, a named service, none that is !excluded, and none when unset", async () => {
    expect(await running(undefined, names)).toEqual([]);
    expect(await running("", names)).toEqual([]);
    expect(await running("none", names)).toEqual([]);
    expect(await running("*", names)).toEqual(names);
    expect(await running("log", names)).toEqual(["log"]);
    expect(await running("log,config", names)).toEqual(["log", "config"]);
    expect(await running("*,!seed,!synth", names)).toEqual(["log", "config"]);
  });

  // scenario: instance-type-run-once
  it("runs a single ^name and nothing else, then ends the process", async () => {
    const kill = jest.spyOn(process, "kill").mockImplementation(() => true);
    try {
      expect(await running("^seed", names)).toEqual(["seed"]);
      expect(kill).toHaveBeenCalledTimes(1);
      expect(kill).toHaveBeenCalledWith(process.pid, "SIGTERM");
      expect(() => new Probe("seed", "^seed,^log")).toThrow();
      expect(() => new Probe("seed", "^seed,log")).toThrow();
    } finally {
      kill.mockRestore();
    }
  });

  // scenario: instance-type-grammar
  it("is read by every background service: with it unset, no scheduled method or startup hook does any work", async () => {
    // Every opt-in a service has is switched on, so only INSTANCE_TYPE can be what holds it back.
    const env = { INSTANCE_TYPE: undefined, SERVICE_CONFIG_STARTUP: "true", SYNTHETIC_TICKER: "true" };
    const saved = Object.fromEntries(Object.keys(env).map((k) => [k, process.env[k]]));
    for (const [k, v] of Object.entries(env)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    const touched: string[] = [];
    // Any use of the database is work.
    const record = (path: string): unknown =>
      new Proxy(() => undefined, {
        get: (_t, key) => (key === "then" ? undefined : record(`${path}.${String(key)}`)),
        apply: () => {
          touched.push(path);
          return Promise.resolve(null);
        },
      });
    try {
      const providers = (Reflect.getMetadata("providers", ServicesModule) as (new (...args: never[]) => object)[]).filter(
        (p) => typeof p === "function",
      );
      const module = await Test.createTestingModule({
        providers: [
          ...providers,
          SchedulerRegistry,
          { provide: AppConfigService.Key, useValue: new AppConfigService() },
          { provide: PrismaService, useValue: { prisma: record("prisma") } },
          { provide: SubscriptionService, useValue: { publish: jest.fn(), asyncIterator: jest.fn() } },
        ],
      }).compile();
      const registry = module.get(SchedulerRegistry);

      const invoked: string[] = [];
      for (const provider of providers) {
        const instance = module.get(provider) as Record<string, unknown>;
        const proto = Object.getPrototypeOf(instance) as object;
        const scheduled = Object.getOwnPropertyNames(proto).filter((m) => {
          const fn = (proto as Record<string, unknown>)[m];
          return typeof fn === "function" && Reflect.getMetadata("SCHEDULER_TYPE", fn) !== undefined;
        });
        for (const method of ["onModuleInit", "onApplicationBootstrap", ...scheduled]) {
          if (typeof instance[method] !== "function") continue;
          invoked.push(`${provider.name}.${method}`);
          await (instance[method] as () => unknown).call(instance);
        }
      }
      expect(invoked).toEqual(expect.arrayContaining(["BackupService.onModuleInit", "BackupService.poll", "SeedService.execute"]));
      expect(touched).toEqual([]);
      expect([...registry.getCronJobs().keys()]).toEqual([]);
      await module.close();
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });
});
