import { AppConfigService } from "@/app.config";
import { isEmpty, isEqual, toLower } from "lodash";

export abstract class BaseService {
  private running = false;
  private readonly runTask;

  constructor(
    readonly service: string,
    configService: AppConfigService,
  ) {
    const instance = configService.instanceType;
    const types = instance.split(/[, |-]+/).map(toLower);
    const runAll = isEmpty(instance) || isEqual(types, ["services"]);
    const runService = types.includes(toLower(this.service));
    this.runTask = runAll || runService;
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
      });
    }
  }

  abstract task(): Promise<void>;
}
