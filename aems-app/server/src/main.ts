import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { INestApplication, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { getLogLevel } from "@/logging";
import { AppConfigService } from "@/app.config";
import { printEnvironment } from "@local/common";
import { NextFunction, Request, Response, json, urlencoded } from "express";
import { inspect } from "util";
import { AppLoggerService } from "@/logging/logging.service";
import { WsAdapter } from "@nestjs/platform-ws";
import { NestExpressApplication } from "@nestjs/platform-express";

async function MainBootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.set("trust proxy", true);
  app.use(json());
  app.use(urlencoded({ extended: true }));
  const configService = app.get<AppConfigService>(AppConfigService.Key);
  app.useLogger(app.get(AppLoggerService));
  const mainLogger = new Logger(MainBootstrap.name);
  if (configService.log.http.level) {
    const httpLogger = new Logger("HttpRequest");
    const level = getLogLevel(configService.log.http.level) ?? "log";
    app.use(function (req: Request, res: Response, next: NextFunction) {
      const start = Date.now();
      res.on("finish", () => {
        httpLogger[level](
          `${req.method} ${req.originalUrl} ${res.statusCode} ${res.statusMessage} - ${res.get("Content-Length") || 0}b sent in ${Date.now() - start}ms`,
        );
      });
      next();
    });
  }
  if (configService.nodeEnv !== "production") {
    mainLogger.warn("CORS enabled for non-production environment");
    app.enableCors({
      origin: "*",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
      credentials: true,
    });
  }
  const wsAdapter = new WsAdapter(app);
  app.useWebSocketAdapter(wsAdapter);
  const documentBuilder = new DocumentBuilder().setTitle("API").setVersion("1.0").build();
  const documentFactory = () => SwaggerModule.createDocument(app, documentBuilder);
  SwaggerModule.setup("swagger", app, documentFactory);
  if (configService.nodeEnv !== "production" || configService.printEnv) {
    printEnvironment({
      printable: (v) => mainLogger.log(v),
      stringify: (v) => inspect(v, undefined, 2, true),
    });
  }
  await app.listen(configService.port);

  process.on("SIGTERM", () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    gracefulShutdown(app);
  });
}

async function gracefulShutdown(app: INestApplication<any>) {
  try {
    await app.close();
    console.log("Cleanup finished. Shutting down.");
  } catch (error) {
    console.error("Error during shutdown", error);
  } finally {
    process.exit(0);
  }
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
MainBootstrap();
