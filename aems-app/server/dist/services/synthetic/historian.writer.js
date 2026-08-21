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
var SyntheticHistorianWriter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyntheticHistorianWriter = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const pg_copy_streams_1 = require("pg-copy-streams");
const promises_1 = require("node:stream/promises");
const node_stream_1 = require("node:stream");
const app_config_1 = require("../../app.config");
let SyntheticHistorianWriter = SyntheticHistorianWriter_1 = class SyntheticHistorianWriter {
    constructor(configService) {
        this.logger = new common_1.Logger(SyntheticHistorianWriter_1.name);
        const { historian } = configService;
        this.pool = historian.url
            ? new pg_1.Pool({
                connectionString: historian.url,
                max: 4,
                idleTimeoutMillis: 30_000,
                connectionTimeoutMillis: 5_000,
            })
            : new pg_1.Pool({
                host: historian.host,
                port: historian.port,
                database: historian.name,
                user: historian.username,
                password: historian.password,
                max: 4,
                idleTimeoutMillis: 30_000,
                connectionTimeoutMillis: 5_000,
            });
        this.pool.on("error", (err) => this.logger.error("Historian pool error", err));
    }
    async onModuleDestroy() {
        await this.pool.end();
    }
    async ensureTopics(topicNames) {
        const client = await this.pool.connect();
        try {
            await client.query(`INSERT INTO topics (topic_name) SELECT UNNEST($1::text[]) ON CONFLICT (topic_name) DO NOTHING`, [topicNames]);
            const { rows } = await client.query(`SELECT topic_id, topic_name FROM topics WHERE topic_name = ANY($1::text[])`, [topicNames]);
            const map = new Map();
            for (const row of rows)
                map.set(row.topic_name, row.topic_id);
            return map;
        }
        finally {
            client.release();
        }
    }
    async copyTopic(topicId, samples) {
        const client = await this.pool.connect();
        let count = 0;
        try {
            const stream = client.query((0, pg_copy_streams_1.from)(`COPY data (ts, topic_id, value_string) FROM STDIN`));
            const source = node_stream_1.Readable.from(this.encodeSamples(topicId, samples, (n) => count++));
            await (0, promises_1.pipeline)(source, stream);
        }
        finally {
            client.release();
        }
        return count;
    }
    *encodeSamples(topicId, samples, onSample) {
        for (const [ts, value] of samples) {
            onSample(1);
            yield `${ts.toISOString()}\t${topicId}\t${value.toString()}\n`;
        }
    }
    async tickInsert(ts, values) {
        if (values.length === 0)
            return;
        const params = [ts.toISOString()];
        const placeholders = [];
        for (const [topicId, value] of values) {
            params.push(topicId, value.toString());
            placeholders.push(`($1, $${params.length - 1}, $${params.length})`);
        }
        await this.pool.query(`INSERT INTO data (ts, topic_id, value_string) VALUES ${placeholders.join(", ")} ON CONFLICT (topic_id, ts) DO NOTHING`, params);
    }
};
exports.SyntheticHistorianWriter = SyntheticHistorianWriter;
exports.SyntheticHistorianWriter = SyntheticHistorianWriter = SyntheticHistorianWriter_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService])
], SyntheticHistorianWriter);
//# sourceMappingURL=historian.writer.js.map