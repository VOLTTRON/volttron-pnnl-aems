import { MiddlewareConsumer, Module } from "@nestjs/common";
import { PassportMiddleware } from "./passport.middleware";
import { PrismaModule } from "@/prisma/prisma.module";
import { AuthModule } from "../auth.module";
import { PassportModule as NestjsPassportModule } from "@nestjs/passport";

@Module({
  imports: [PrismaModule, AuthModule, NestjsPassportModule.register({ session: true })],
})
export class PassportModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PassportMiddleware).forRoutes("*");
  }
}
