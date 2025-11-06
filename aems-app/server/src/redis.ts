import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

async function redis() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.REDIS,
    options: {
      host: "localhost",
      port: 6379,
    },
  });
  await app.listen();
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
redis();
