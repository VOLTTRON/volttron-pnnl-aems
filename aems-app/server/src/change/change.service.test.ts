import { Test, TestingModule } from "@nestjs/testing";
import { ChangeMutation } from "@prisma/client";
import { ChangeService } from "./change.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

type Model =
  | "Schedule"
  | "Configuration"
  | "Control"
  | "Location"
  | "Unit"
  | "Occupancy"
  | "Holiday"
  | "Setpoint";

describe("ChangeService.handleChange", () => {
  let module: TestingModule;
  let service: ChangeService;
  let created: { data: Record<string, unknown> }[];
  let create: jest.Mock;
  let publish: jest.Mock;

  beforeEach(async () => {
    created = [];
    create = jest.fn(({ data }: { data: Record<string, unknown> }) => {
      const row = { id: `change-${created.length + 1}`, ...data };
      created.push({ data });
      return Promise.resolve(row);
    });
    publish = jest.fn().mockResolvedValue(undefined);
    module = await Test.createTestingModule({
      providers: [
        ChangeService,
        { provide: PrismaService, useValue: { prisma: { change: { create } } } },
        { provide: SubscriptionService, useValue: { publish } },
      ],
    }).compile();
    service = module.get(ChangeService);
  });

  afterEach(async () => {
    await module.close();
  });

  // Every tracked entity writes exactly one row, naming the user, table, key, mutation and data.
  // scenario: edit-writes-change
  it.each<[Model, string]>([
    ["Schedule", "schedule"],
    ["Configuration", "configuration"],
    ["Control", "control"],
    ["Location", "location"],
    ["Unit", "unit"],
    ["Occupancy", "occupancy"],
    ["Holiday", "holiday"],
    ["Setpoint", "setpoint"],
  ])("writes one change record for %s with user, table, key, mutation and data", async (type, table) => {
    const entity = { id: 42, label: "example" };
    await service.handleChange("the-key", entity as never, type as never, ChangeMutation.Update, { id: "user-7" } as Express.User);

    expect(create).toHaveBeenCalledTimes(1);
    expect(created[0].data).toMatchObject({
      userId: "user-7",
      table,
      key: "the-key",
      mutation: ChangeMutation.Update,
      data: entity,
    });
    expect(publish).toHaveBeenCalledWith("Change", expect.objectContaining({ topic: "Change" }));
  });

  it("writes a change record identified by a user id string, as the services process does", async () => {
    await service.handleChange(
      "unit-7",
      { id: 1 } as never,
      "Unit" as never,
      ChangeMutation.Create,
      "service-user",
    );
    expect(created[0].data).toMatchObject({ userId: "service-user", table: "unit" });
  });

  it("refuses to write when no user id can be resolved", async () => {
    await expect(
      service.handleChange("k", { id: 1 } as never, "Unit" as never, ChangeMutation.Create, { id: null } as never),
    ).rejects.toThrow(/User ID not found/);
    expect(create).not.toHaveBeenCalled();
  });
});
