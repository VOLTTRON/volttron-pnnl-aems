import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PothosGraphQLModule } from "@/graphql/pothos.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { AppConfigToken } from "@/app.config";
import { LoggingModule } from "@/logging/logging.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [AppConfigToken],
      envFilePath: [".env", ".env.local"],
    }),
    LoggingModule,
    PrismaModule,
    PothosGraphQLModule.forRoot(),
  ],
})
export class SchemaAppModule {}
