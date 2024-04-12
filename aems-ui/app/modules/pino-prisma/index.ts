import build from "pino-abstract-transport";
import { PrismaClient } from "@prisma/client";
import { Transform } from "node:stream";

const transport = async function (options: { levels?: Record<string, any> }) {
  const prisma = new PrismaClient();
  return build(
    async function (transform: Transform & build.OnUnknown) {
      for await (let obj of transform) {
        await prisma.log.create({
          data: {
            type: options.levels?.[obj.level] ?? "Info",
            message: obj.msg,
            expiration: null,
          },
        });
      }
    },
    {
      async close(_err) {
        await prisma.$disconnect();
      },
    }
  );
};

export default transport;
