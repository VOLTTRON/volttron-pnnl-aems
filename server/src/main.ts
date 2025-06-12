import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { getLogLevel } from "@/logging";
import { AuthService, Session } from "./auth/auth.service";
import { AppConfigService } from "@/app.config";
import { printEnvironment } from "@local/common";
import { NextFunction, Request, Response } from "express";
import { inspect } from "util";
import { AppLoggerService } from "@/logging/logging.service";
import { WsAdapter } from "@nestjs/platform-ws";

async function MainBootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(AppLoggerService));
  const mainLogger = new Logger(MainBootstrap.name);
  if (process.env.LOG_HTTP_REQUEST_LEVEL) {
    const httpLogger = new Logger("HttpRequest");
    const level = getLogLevel(process.env.LOG_HTTP_REQUEST_LEVEL) ?? "log";
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
  if (process.env.NODE_ENV !== "production") {
    mainLogger.warn("CORS enabled for non-production environment");
    app.enableCors({
      origin: process.env.CORS_ORIGIN ?? "*",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
      credentials: true,
    });
  }
  const authService = app.get(AuthService);
  app.use(authService.session);
  app.use(authService.passport.initialize());
  app.use(authService.passport.authenticate(Session));
  const wsAdapter = new WsAdapter(app);
  app.useWebSocketAdapter(wsAdapter);
  const documentBuilder = new DocumentBuilder().setTitle("API").setVersion("1.0").build();
  const documentFactory = () => SwaggerModule.createDocument(app, documentBuilder);
  SwaggerModule.setup("swagger", app, documentFactory);
  const configService = app.get<AppConfigService>(AppConfigService.Key);
  if (configService.nodeEnv !== "production") {
    printEnvironment({
      printable: (v) => mainLogger.log(v),
      stringify: (v) => inspect(v, undefined, 2, true),
    });
  }
  await app.listen(configService.port);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
MainBootstrap();
