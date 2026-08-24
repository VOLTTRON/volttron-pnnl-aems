"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SyntheticTickerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyntheticTickerService = void 0;
const common_1 = require("@nestjs/common");
const app_config_1 = require("../../app.config");
const historian_writer_1 = require("./historian.writer");
const synthetic_service_1 = require("./synthetic.service");
const MIN_TICK_MS = 5_000;
let SyntheticTickerService = SyntheticTickerService_1 = class SyntheticTickerService {
    constructor(configService, writer, synthetic) {
        this.configService = configService;
        this.writer = writer;
        this.synthetic = synthetic;
        this.logger = new common_1.Logger(SyntheticTickerService_1.name);
        this.timer = null;
        this.registry = null;
        this.busy = false;
        this.stopped = false;
    }
    async onModuleInit() {
        const { ticker, tickSeconds } = this.configService.service.synthetic;
        if (!ticker)
            return;
        if (this.configService.instanceName === "Schema")
            return;
        const intervalMs = Math.max(MIN_TICK_MS, tickSeconds * 1_000);
        this.logger.log(`Synthetic ticker armed: every ${intervalMs / 1000}s (waiting for backfill to complete)...`);
        void this.synthetic.backfillReady.then(() => {
            if (this.stopped)
                return;
            this.logger.log(`Synthetic ticker started.`);
            this.scheduleNext(intervalMs);
        });
    }
    onModuleDestroy() {
        this.stopped = true;
        if (this.timer)
            clearTimeout(this.timer);
    }
    scheduleNext(intervalMs) {
        if (this.stopped)
            return;
        this.timer = setTimeout(() => {
            void this.runTick(intervalMs);
        }, intervalMs);
    }
    async runTick(intervalMs) {
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
            const values = await this.synthetic.collectTickValues(this.registry, ts);
            await this.writer.tickInsert(ts, values);
        }
        catch (err) {
            this.logger.warn(`Synthetic tick failed: ${err instanceof Error ? err.message : String(err)}`);
        }
        finally {
            this.busy = false;
            this.scheduleNext(intervalMs);
        }
    }
};
exports.SyntheticTickerService = SyntheticTickerService;
exports.SyntheticTickerService = SyntheticTickerService = SyntheticTickerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService,
        historian_writer_1.SyntheticHistorianWriter,
        synthetic_service_1.SyntheticService])
], SyntheticTickerService);
//# sourceMappingURL=synthetic-ticker.service.js.map