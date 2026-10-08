import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
import { SyntheticHistorianWriter } from "./historian.writer";
import { SyntheticService, TopicRegistry } from "./synthetic.service";

const MIN_TICK_MS = 5_000;

@Injectable()
export class SyntheticTickerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyntheticTickerService.name);
  private timer: NodeJS.Timeout | null = null;
  private registry: TopicRegistry | null = null;
  private busy = false;
  private stopped = false;

  constructor(
    @Inject(AppConfigService.Key) private readonly configService: AppConfigService,
    private readonly writer: SyntheticHistorianWriter,
    private readonly synthetic: SyntheticService,
  ) {}

  onModuleInit(): void {
    const { ticker, tickSeconds } = this.configService.service.synthetic;
    if (!ticker) return;
    if (this.configService.instanceName === "Schema") return;

    const intervalMs = Math.max(MIN_TICK_MS, tickSeconds * 1_000);
    this.logger.log(`Synthetic ticker armed: every ${intervalMs / 1000}s (waiting for backfill to complete)...`);

    // Wait until the backfill task has finished before firing the first
    // tick. Otherwise a partial backfill races the ticker and leaves
    // the window sparsely populated.
    void this.synthetic.backfillReady.then(() => {
      if (this.stopped) return;
      this.logger.log(`Synthetic ticker started.`);
      this.scheduleNext(intervalMs);
    });
  }

  onModuleDestroy(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
  }

  private scheduleNext(intervalMs: number): void {
    if (this.stopped) return;
    this.timer = setTimeout(() => {
      void this.runTick(intervalMs);
    }, intervalMs);
  }

  private async runTick(intervalMs: number): Promise<void> {
    if (this.busy || this.stopped) {
      this.scheduleNext(intervalMs);
      return;
    }
    this.busy = true;
    try {
      if (!this.registry) {
        this.registry = await this.synthetic.loadRegistry();
        if (!this.registry) {
          this.logger.warn("No synthetic units found — is topology seeded? Retrying next tick.");
          return;
        }
        this.logger.log(`Ticker registry loaded: ${this.registry.topicIds.size} topics.`);
      }

      const ts = new Date();
      ts.setSeconds(0, 0);
      const values = this.synthetic.collectTickValues(this.registry, ts);
      await this.writer.tickInsert(ts, values);

      const { historianDays } = this.configService.service.synthetic;
      const cutoff = new Date(ts.getTime() - historianDays * 86_400_000);
      const pruned = await this.writer.pruneOlderThan(
        Array.from(this.registry.topicIds.values()),
        cutoff,
      );
      if (pruned > 0) this.logger.debug(`Pruned ${pruned} demo rows older than ${cutoff.toISOString()}.`);
    } catch (err) {
      this.logger.warn(`Synthetic tick failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.busy = false;
      this.scheduleNext(intervalMs);
    }
  }
}
