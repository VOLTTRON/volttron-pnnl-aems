import { NestFactory } from "@nestjs/core";
import { resolve } from "node:path";
import { rm, stat } from "node:fs/promises";
import { ConsoleLogger, Logger } from "@nestjs/common";
import { AppModule } from "@/app.module";
import { getLogLevels } from "@/logging";

async function GenerateSchema() {
  process.env.NODE_ENV = "development";
  process.env.INSTANCE_TYPE = "";
  const logger = new Logger(GenerateSchema.name);
  const controller = new AbortController();
  const { signal } = controller;
  setTimeout(() => controller.abort(), 60000);
  const watcher = async () => {
    const filename = resolve(process.cwd(), "schema.graphql");
    await rm(filename, { force: true });
    logger.log("Waiting for 'schema.graphql' to update...");
    while ((await stat(filename).catch(() => null)) === null && !signal.aborted) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (signal.aborted) {
      logger.error("Timed out waiting for 'schema.graphql' to update");
      process.exit(1);
    } else {
      logger.log("Graphql schema updated");
      process.exit(0);
    }
  };
  watcher().catch((error) => {
    logger.error(error);
    process.exit(1);
  });
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      logLevels: getLogLevels(process.env.LOG_CONSOLE_LEVEL ?? ""),
      prefix: "Server",
      timestamp: true,
    }),
  });
  await app.init();
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
GenerateSchema();
