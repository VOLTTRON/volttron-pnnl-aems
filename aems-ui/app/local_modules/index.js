"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_abstract_transport_1 = __importDefault(require("pino-abstract-transport"));
const client_1 = require("@prisma/client");
const transport = async function (options) {
    const prisma = new client_1.PrismaClient();
    return (0, pino_abstract_transport_1.default)(async function (transform) {
        for await (let obj of transform) {
            await prisma.log.create({
                data: {
                    type: options.levels?.[obj.level] ?? "Info",
                    message: obj.msg,
                    expiration: null,
                },
            });
        }
    }, {
        async close(_err) {
            await prisma.$disconnect();
        },
    });
};
exports.default = transport;
//# sourceMappingURL=index.js.map