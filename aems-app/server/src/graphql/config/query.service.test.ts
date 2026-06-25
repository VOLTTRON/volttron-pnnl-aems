import { ConfigQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { AppConfigService } from "@/app.config";

const resolvers: Record<string, () => unknown> = {};

function makeBuilder(): SchemaBuilderService {
  const mockT = {
    exposeBoolean: jest.fn((field: string) => field),
  };
  const objectRefImplementer = {
    implement: jest.fn((opts: any) => {
      opts.fields?.(mockT);
      return "ServerConfigRef";
    }),
  };
  return {
    objectRef: jest.fn(() => objectRefImplementer),
    queryField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb({ field: jest.fn((o: any) => o) });
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeConfigService(serviceOverride: boolean, holidaySchedule: boolean): AppConfigService {
  return {
    service: { config: { serviceOverride, holidaySchedule } },
  } as unknown as AppConfigService;
}

describe("ConfigQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers a readConfig query field", () => {
    new ConfigQuery(makeBuilder(), makeConfigService(true, false));
    expect(resolvers["readConfig"]).toBeDefined();
  });

  it("readConfig returns the whitelisted config flags", () => {
    new ConfigQuery(makeBuilder(), makeConfigService(true, false));
    expect(resolvers["readConfig"]()).toEqual({ serviceOverride: true, holidaySchedule: false });
  });

  it("readConfig reflects different config values", () => {
    new ConfigQuery(makeBuilder(), makeConfigService(false, true));
    expect(resolvers["readConfig"]()).toEqual({ serviceOverride: false, holidaySchedule: true });
  });
});
