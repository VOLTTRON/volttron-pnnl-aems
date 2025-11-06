import { PrismaService } from "@/prisma/prisma.service";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Timeout } from "@nestjs/schedule";
import { BaseService } from "..";
import { AppConfigService } from "@/app.config";

@Injectable()
export class LogService extends BaseService {
  private logger = new Logger(LogService.name);
  private started = new Date(new Date().getTime() - process.uptime() * 1000);
  private prune;

  constructor(
    private prismaService: PrismaService,
    @Inject(AppConfigService.Key) configService: AppConfigService,
  ) {
    super("log", configService);
    this.prune = configService.service.log.prune;
  }

  @Timeout(1000)
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
    this.logger.log("Pruning existing log messages...");
    await this.prismaService.prisma.log
      .deleteMany({ where: { createdAt: { lt: this.started } } })
      .then(() => {
        this.logger.log("Successfully pruned old log messages.");
      })
      .catch((error: Error) => {
        this.logger.warn({ message: error.message, stack: error.stack });
      });
  }
}
