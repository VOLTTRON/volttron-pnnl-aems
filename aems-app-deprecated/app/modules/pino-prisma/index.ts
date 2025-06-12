import build from "pino-abstract-transport";
import { Transform } from "node:stream";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";

const transport = async function (options: { levels?: Record<string, any> }) {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    return build(
      async function (transform: Transform & build.OnUnknown) {
        for await (const obj of transform) {
          await pool
            .query(
              `INSERT INTO "Log" ("id", "type", "message", "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW())`,
              [randomUUID(), options.levels?.[obj.level] ?? "Info", obj.msg]
            )
            .catch((error) => {
              console.error("pino-prisma.transport", error);
            });
        }
      },
      {
        async close(_err) {
          await pool.end();
        },
      }
    );
  } catch (error) {
    console.error("pino-prisma.build", error);
  }
};

export default transport;
