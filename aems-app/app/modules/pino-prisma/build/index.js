"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_abstract_transport_1 = __importDefault(require("pino-abstract-transport"));
const pg_1 = require("pg");
const node_crypto_1 = require("node:crypto");
const transport = async function (options) {
    try {
        const pool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
        });
        return (0, pino_abstract_transport_1.default)(async function (transform) {
            for await (const obj of transform) {
                await pool
                    .query(`INSERT INTO "Log" ("id", "type", "message", "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW())`, [(0, node_crypto_1.randomUUID)(), options.levels?.[obj.level] ?? "Info", obj.msg])
                    .catch((error) => {
                    console.error("pino-prisma.transport", error);
                });
            }
        }, {
            async close(_err) {
                await pool.end();
            },
        });
    }
    catch (error) {
        console.error("pino-prisma.build", error);
    }
};
exports.default = transport;
//# sourceMappingURL=index.js.map