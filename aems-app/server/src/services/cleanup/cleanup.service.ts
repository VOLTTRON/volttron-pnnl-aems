import { Inject, Injectable, Logger } from "@nestjs/common";
import { BaseService } from "..";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
import { Cron } from "@nestjs/schedule";
import { StageType, typeofNonNullable } from "@local/common";
import { dateKey, todayIn } from "../config/config.occupancy";

@Injectable()
export class CleanupService extends BaseService {
  private logger = new Logger(CleanupService.name);
  constructor(
    private prismaService: PrismaService,
    @Inject(AppConfigService.Key) private configService: AppConfigService,
  ) {
    super("cleanup", configService);
  }

  @Cron(`0 0 * * *`)
  execute(): Promise<void> {
    return super.execute();
  }

  async task() {
    this.logger.log("Checking for occupancies that need to be cleaned up...");
    const fallback = this.configService.volttron.timezone;
    return this.prismaService.prisma.occupancy
      .findMany({ include: { configuration: { include: { units: true } } } })
      .then((all) =>
        // Past only once it is past for every unit using it: "today" is each unit's own.
        all.filter((occupancy) => {
          const units = occupancy.configuration?.units ?? [];
          const todays = units.length > 0 ? units.map((unit) => todayIn([unit.timezone, fallback])) : [todayIn([fallback])];
          return todays.every((today) => dateKey(occupancy.date) < today);
        }),
      )
      .then(async (occupancies) => {
        const occupancyIds = occupancies.map((occupancy) => occupancy.id);
        const unitIds = new Set(
          occupancies
            .map((occupancy) => occupancy.configuration?.units.map((unit) => unit.id))
            .flat()
            .filter((id) => typeofNonNullable(id)),
        );
        const result = await this.prismaService.prisma.occupancy.deleteMany({
          where: { id: { in: occupancyIds } },
        });
        await this.prismaService.prisma.unit.updateMany({
          where: { id: { in: Array.from(unitIds) } },
          data: { stage: StageType.ProcessType.enum },
        });
        this.logger.log(
          `Cleaned up ${result.count} ${
            result.count === 1 ? " occupancy" : " occupancies"
          } dated before today.`,
        );
      })
      .catch((error: Error) => {
        this.logger.warn({ message: error.message, stack: error.stack });
      });
  }
}
