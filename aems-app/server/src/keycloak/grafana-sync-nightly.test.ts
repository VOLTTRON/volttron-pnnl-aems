import { AppConfigService } from "@/app.config";
import { KeycloakSyncService } from "./keycloak-sync.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { SCHEDULE_CRON_OPTIONS } from "@nestjs/schedule/dist/schedule.constants";

function makeConfig(): AppConfigService {
  return {
    grafana: { configPath: "", path: "/gdb", url: "http://g" },
    volttron: { campus: "pnnl", building: "sef" },
    instanceType: "*",
  } as unknown as AppConfigService;
}

function makePrisma(): PrismaService {
  return {
    prisma: {
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    },
  } as unknown as PrismaService;
}

// scenario: grafana-sync-nightly
describe("the nightly sync runs on consecutive nights", () => {
  it("is wired to a daily-midnight cron expression", () => {
    const options = Reflect.getMetadata(
      SCHEDULE_CRON_OPTIONS,
      KeycloakSyncService.prototype.dailySync,
    ) as { cronTime: string };
    expect(options.cronTime).toBe("0 0 * * *");
  });

  it("fires its sync body on every call, so a second midnight runs just like the first", async () => {
    const sync = new KeycloakSyncService(
      makeConfig(),
      makePrisma(),
      {} as unknown as SubscriptionService,
    );
    const syncAll = jest
      .spyOn(sync as unknown as { syncAllUsers: () => Promise<void> }, "syncAllUsers")
      .mockResolvedValue(undefined);

    await sync.dailySync();
    await sync.dailySync();

    expect(syncAll).toHaveBeenCalledTimes(2);
  });
});
