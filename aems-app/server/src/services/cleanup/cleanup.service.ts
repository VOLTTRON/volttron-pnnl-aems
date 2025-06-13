import { Inject, Injectable, Logger } from "@nestjs/common";
import { BaseService } from "..";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
import { Cron } from "@nestjs/schedule";
import { StageType, typeofNonNullable } from "@local/common";

@Injectable()
export class CleanupService extends BaseService {
  private logger = new Logger(CleanupService.name);
  private started = new Date(new Date().getTime() - process.uptime() * 1000);

  constructor(
    private prismaService: PrismaService,
    @Inject(AppConfigService.Key) configService: AppConfigService,
  ) {
    super("cleanup", configService);
  }

  @Cron(`0 0 * * *`)
  execute(): Promise<void> {
    return super.execute();
  }

  async task() {
    this.logger.log("Checking for occupancies that need to be cleaned up...");
    return this.prismaService.prisma.occupancy
      .findMany({
        where: { date: { lt: new Date(Date.now() - this.started.getTime()) } },
        include: { configuration: { include: { units: true } } },
      })
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
          } that occurred prior to ${this.started.toLocaleDateString()}.`,
        );
      })
      .catch((error) => {
        this.logger.warn({ message: error.message, stack: error.stack });
      });
  }
}
