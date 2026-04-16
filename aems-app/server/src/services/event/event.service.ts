import { PrismaService } from "@/prisma/prisma.service";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, Timeout } from "@nestjs/schedule";
import { BaseService } from "..";
import { AppConfigService } from "@/app.config";
import { Frequency } from "@local/common";

@Injectable()
export class EventService extends BaseService {
  private logger = new Logger(EventService.name);
  private prune: boolean;
  private ageValue: number;
  private ageUnit: string;

  constructor(
    private prismaService: PrismaService,
    @Inject(AppConfigService.Key) configService: AppConfigService,
  ) {
    super("event", configService);
    this.prune = configService.service.event.prune;
    this.ageValue = configService.service.event.age.value;
    this.ageUnit = configService.service.event.age.unit;
  }

  @Timeout(1000) // Initial delay of 1 second before first execution
  @Cron("0 0 * * *") // Runs daily at midnight
  execute(): Promise<void> {
    return super.execute();
  }

  schedule() {
    if (!this.prune) {
      return false;
    }
    return super.schedule();
  }

  async task() {
    this.logger.log("Pruning old events...");

    // Calculate cutoff date using Frequency conversion
    const ageInMilliseconds = Frequency.convert(this.ageUnit, this.ageValue, Frequency.Millisecond);
    const cutoffDate = new Date(Date.now() - ageInMilliseconds);

    this.logger.log(`Deleting events older than ${this.ageValue} ${this.ageUnit} (before ${cutoffDate.toISOString()})`);

    await this.prismaService.prisma.event
      .deleteMany({ where: { createdAt: { lt: cutoffDate } } })
      .then((result) => {
        this.logger.log(`Successfully pruned ${result.count} old events.`);
      })
      .catch((error: Error) => {
        this.logger.warn({ message: error.message, stack: error.stack });
      });
  }
}
