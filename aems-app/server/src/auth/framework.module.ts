import { DynamicModule, Module } from "@nestjs/common";
import { RouterModule } from "@nestjs/core";
import { AuthModule } from "./auth.module";
import { AuthjsModule } from "./authjs/authjs.module";
import { PassportModule } from "./passport/passport.module";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
  imports: [AuthModule, PrismaModule],
})
export class FrameworkModule {
  static register(options?: { path?: string }): DynamicModule {
    return {
      module: FrameworkModule,
      imports: [
        AuthModule,
        ...(options?.path
          ? [
              AuthjsModule,
              RouterModule.register([{ path: options.path, module: AuthjsModule }]),
              PassportModule,
              RouterModule.register([{ path: options.path, module: PassportModule }]),
            ]
          : [AuthjsModule, PassportModule]),
      ],
    };
  }
}
