import { Inject, Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Pool } from "pg";
import { from as copyFrom } from "pg-copy-streams";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { AppConfigService } from "@/app.config";

@Injectable()
export class SyntheticHistorianWriter implements OnModuleDestroy {
  private readonly logger = new Logger(SyntheticHistorianWriter.name);
  private readonly pool: Pool;

  constructor(@Inject(AppConfigService.Key) configService: AppConfigService) {
    const { historian } = configService;
    this.pool = historian.url
      ? new Pool({
          connectionString: historian.url,
          max: 4,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 5_000,
        })
      : new Pool({
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

  async ensureTopics(topicNames: string[]): Promise<Map<string, number>> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO topics (topic_name) SELECT UNNEST($1::text[]) ON CONFLICT (topic_name) DO NOTHING`,
        [topicNames],
      );
      const { rows } = await client.query<{ topic_id: number; topic_name: string }>(
        `SELECT topic_id, topic_name FROM topics WHERE topic_name = ANY($1::text[])`,
        [topicNames],
      );
      const map = new Map<string, number>();
      for (const row of rows) map.set(row.topic_name, row.topic_id);
      return map;
    } finally {
      client.release();
    }
  }

  /**
   * True iff `data` has any row for this topic older than `olderThan` ms
   * before now. Distinguishes real backfill (rows are days-to-months old)
   * from just-inserted ticker samples (seconds-to-minutes old) so a topic
   * that only has stray ticker rows still gets its full 90-day backfill.
   */
  async topicHasData(topicId: number, olderThanMs = 60 * 60 * 1000): Promise<boolean> {
    const { rows } = await this.pool.query<{ exists: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM data WHERE topic_id = $1 AND ts < NOW() - ($2::int * INTERVAL '1 millisecond')) AS exists`,
      [topicId, olderThanMs],
    );
    return rows[0]?.exists === true;
  }

  /**
   * Delete any rows in the given window for one topic. Used before a
   * `copyTopic` re-fill so raw COPY (no ON CONFLICT) can't PK-conflict on
   * a handful of ticker-inserted rows that snuck in first.
   */
  async clearRange(topicId: number, start: Date, end: Date): Promise<number> {
    const { rowCount } = await this.pool.query(
      `DELETE FROM data WHERE topic_id = $1 AND ts >= $2 AND ts <= $3`,
      [topicId, start.toISOString(), end.toISOString()],
    );
    return rowCount ?? 0;
  }

  /**
   * COPY-stream one topic's samples. `samples` yields `[Date, number]` pairs
   * ordered by ts. Uses `COPY ... FROM STDIN` for order-of-magnitude speed
   * over batched INSERT at 100k+ rows per topic.
   */
  async copyTopic(topicId: number, samples: Iterable<[Date, number]>): Promise<number> {
    const client = await this.pool.connect();
    let count = 0;
    try {
      const stream = client.query(copyFrom(`COPY data (ts, topic_id, value_string) FROM STDIN`));
      const source = Readable.from(this.encodeSamples(topicId, samples, () => count++));
      await pipeline(source, stream);
    } finally {
      client.release();
    }
    return count;
  }

  private *encodeSamples(
    topicId: number,
    samples: Iterable<[Date, number]>,
    onSample: (n: number) => void,
  ): Iterable<string> {
    for (const [ts, value] of samples) {
      onSample(1);
      yield `${ts.toISOString()}\t${topicId}\t${value.toString()}\n`;
    }
  }

  /**
   * Single-timestamp multi-topic insert used by the ticker. `values` is
   * `[topicId, value]` per topic. Uses ON CONFLICT DO NOTHING so a late
   * tick colliding with backfill is safe.
   */
  async tickInsert(ts: Date, values: [number, number][]): Promise<void> {
    if (values.length === 0) return;
    const params: unknown[] = [ts.toISOString()];
    const placeholders: string[] = [];
    for (const [topicId, value] of values) {
      params.push(topicId, value.toString());
      placeholders.push(`($1, $${params.length - 1}, $${params.length})`);
    }
    await this.pool.query(
      `INSERT INTO data (ts, topic_id, value_string) VALUES ${placeholders.join(", ")} ON CONFLICT (topic_id, ts) DO NOTHING`,
      params,
    );
  }
}
