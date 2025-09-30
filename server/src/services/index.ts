import { AppConfigService } from "@/app.config";
import { typeofNonNullable } from "@local/common";
import { Logger } from "@nestjs/common";
import { toLower, trim } from "lodash";

export abstract class BaseService {
  private baseLogger = new Logger(BaseService.name);
  private running = false;
  private readonly runTask;
  private readonly shutdown;
  private readonly service;

  constructor(service: string, configService: AppConfigService) {
    this.service = toLower(service.trim());
    const instance = configService.instanceType.trim();
    const types = instance.split(/[, ]+/).map(toLower).map(trim);
    const shutdown = types.map((type) => /^\^([^*!^]+)$/.exec(type)?.[1]).filter(typeofNonNullable);
    if (shutdown.length > 1) {
      throw new Error(`Can only specify a single shutdown service: ${types.join(",")}`);
    }
    const enabled = types.map((type) => /^([^*!^]+)$/.exec(type)?.[1]).filter(typeofNonNullable);
    if (shutdown.length > 0 && enabled.length > 0) {
      throw new Error(`Can't specify both shutdown and enabled services: ${types.join(",")}`);
    }
    enabled.push(...shutdown);
    const wildcard = types.filter((type) => /^\*$/.exec(type)?.[0]).filter(typeofNonNullable).length > 0;
    if (wildcard) {
      enabled.push(this.service);
    }
    const disabled = types.map((type) => /^!([^*!^]+)$/.exec(type)?.[1]).filter(typeofNonNullable);
    this.shutdown = shutdown.includes(this.service);
    this.runTask = enabled.includes(this.service) && !disabled.includes(this.service);
  }

  schedule() {
    if (this.running || !this.runTask) {
      return false;
    }
    this.running = true;
    return true;
  }

  async execute() {
    if (this.schedule()) {
      await this.task().finally(() => {
        this.running = false;
        if (this.shutdown) {
          this.baseLogger.log("Seeding completed successfully. Shutting down...");
          process.kill(process.pid, "SIGTERM");
        }
      });
    }
  }

  abstract task(): Promise<void>;
}
