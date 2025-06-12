import { DynamicModule, Module } from "@nestjs/common";
import { BearerModule } from "./bearer/bearer.module";
import { LocalModule } from "./local/local.module";
import { KeycloakModule } from "./keycloak/keycloak.module";
import { RouterModule } from "@nestjs/core";
import { AuthModule } from "./auth.module";
import { SuperModule } from "./super/super.module";

@Module({})
export class ProviderModule {
  static register(options?: { path?: string }): DynamicModule {
    return {
      module: ProviderModule,
      imports: [
        ...(options?.path
          ? [AuthModule, RouterModule.register([{ path: options.path, module: AuthModule }])]
          : [AuthModule]),
        ...[BearerModule, KeycloakModule, LocalModule, SuperModule]
          .map((m) =>
            options?.path
              ? [m, RouterModule.register([{ path: options.path, children: [{ path: "auth", module: m }] }])]
              : [m, RouterModule.register([{ path: "auth", module: m }])],
          )
          .flat(),
      ],
    };
  }
}
