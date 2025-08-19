import { Logger, Module } from "@nestjs/common";
import { KeycloakAuthjsService, KeycloakPassportService } from "./keycloak.service";
import { KeycloakController } from "./keycloak.controller";
import { Provider } from ".";
import { AuthModule } from "../auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { AppConfigService } from "@/app.config";
import { AuthService } from "../auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { SubscriptionModule } from "@/subscription/subscription.module";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { typeofObject } from "@local/common";

interface KeycloakCerts {
  keys: {
    kid: string;
    kty: string;
    alg: string;
    use: string;
    x5c: string[];
    x5t: string;
    "x5t#S256": string;
    n: string;
    e: string;
  }[];
}

interface WellKnown {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  end_session_endpoint: string;
  check_session_iframe: string;
  grant_types_supported: string[];
  response_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  scopes_supported: string[];
  claims_supported: string[];
}

class WellKnownStruct implements Partial<WellKnown> {
  issuer?: string;
  authorization_endpoint?: string;
  token_endpoint?: string;
  userinfo_endpoint?: string;
  jwks_uri?: string;
  end_session_endpoint?: string;
  check_session_iframe?: string;
  grant_types_supported?: string[];
  response_types_supported?: string[];
  subject_types_supported?: string[];
  id_token_signing_alg_values_supported?: string[];
  scopes_supported?: string[];
  claims_supported?: string[];

  constructor(data?: Partial<WellKnown>) {
    Object.assign(this, data ?? {});
  }
}

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    SubscriptionModule,
    JwtModule.registerAsync({
      useFactory: async (configService: AppConfigService) => {
        if (!configService.keycloak.certsUrl || !configService.auth.providers.includes(Provider)) {
          return {};
        }
        const logger = new Logger(KeycloakModule.name);
        const certs: KeycloakCerts | void = await fetch(`${configService.keycloak.certsUrl}`)
          .then((res) => res.json() as unknown as KeycloakCerts)
          .catch((err) => logger.error("Failed to fetch Keycloak public key.", err));
        let algorithm: string | undefined = "RS256";
        let publicKey = certs?.keys?.find((key) => key.alg === algorithm)?.x5c?.[0];
        if (!publicKey) {
          const cert = certs?.keys?.pop();
          publicKey = cert?.x5c?.[0];
          algorithm = cert?.alg;
        }
        return {
          publicKey: publicKey,
        };
      },
      inject: [AppConfigService.Key],
    }),
  ],
  providers: [
    {
      provide: Provider,
      inject: [AuthService, AppConfigService.Key, PrismaService, SubscriptionService, JwtService],
      useFactory: async (
        authService: AuthService,
        configService: AppConfigService,
        prismaService: PrismaService,
        subscriptionService: SubscriptionService,
        jwtService: JwtService,
      ) => {
        if (configService.auth.providers.includes(Provider)) {
          if (configService.keycloak.wellKnownUrl) {
            const logger = new Logger(KeycloakModule.name);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const response = await fetch(configService.keycloak.wellKnownUrl)
              .then((res) => {
                try {
                  return res.json();
                } catch (error: any) {
                  throw new Error("Failed to parse Keycloak well-known configuration: " + (error as Error)?.message);
                }
              })
              .catch((error: any) => {
                throw new Error("Failed to fetch Keycloak well-known configuration: " + (error as Error)?.message);
              });
            if (
              typeofObject<WellKnown>(
                response,
                (v) => typeof v === "object" && Object.keys(new WellKnownStruct()).every((k) => k in v),
              )
            ) {
              logger.log("Updating the configuration with Keycloak well-known data.");
              configService.keycloak.authUrl = response.authorization_endpoint;
              configService.keycloak.tokenUrl = response.token_endpoint;
              configService.keycloak.userinfoUrl = response.userinfo_endpoint;
              configService.keycloak.certsUrl = response.jwks_uri;
              configService.keycloak.logoutUrl = response.end_session_endpoint;
              if (!configService.keycloak.scope.split(" ").every((s) => response.scopes_supported.includes(s))) {
                logger.warn(
                  `Requested Keycloak scopes "${configService.keycloak.scope}" are not fully supported by the Keycloak server. Supported scopes: ${response.scopes_supported.join(", ")}`,
                );
              }
            }
          }
          return configService.auth.framework === "passport"
            ? new KeycloakPassportService(authService, configService, prismaService, subscriptionService, jwtService)
            : new KeycloakAuthjsService(authService, configService);
        }
        return null;
      },
    },
  ],
  // todo: make this cleaner
  controllers: new AppConfigService().auth.framework === "passport" ? [KeycloakController] : [],
})
export class KeycloakModule {
  static readonly provider = Provider;
}
