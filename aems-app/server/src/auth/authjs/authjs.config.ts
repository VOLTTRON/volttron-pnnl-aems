import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { ExpressAuthConfig } from "@auth/express";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { AuthjsProvider, AuthService } from "../auth.service";
import { typeofObject, RoleType, typeofEnum, Mutation } from "@local/common";
import { RoleEnum } from "@local/common/dist/constants";
import { SubscriptionService } from "@/subscription/subscription.service";
import { randomUUID } from "node:crypto";
import { Logger } from "@nestjs/common";

const validateStore = (store: string) => {
  switch (store.toLocaleLowerCase()) {
    case "jwt":
      return "jwt";
    case "database":
      return "database";
    default:
      throw new Error(`Invalid Authjs session store '${store}'.`);
  }
};

export const buildConfig = (
  configService: AppConfigService,
  prismaService: PrismaService,
  authService: AuthService,
  subscriptionService: SubscriptionService,
): ExpressAuthConfig => {
  const logger = new Logger("AuthjsConfig");

  return {
    adapter: PrismaAdapter(prismaService.prisma),
    basePath: "/authjs",
    callbacks: {
      redirect({ url }) {
        return configService.nodeEnv !== "production" ? (configService.cors.origin ?? url) : url;
      },
      jwt({ token, account, profile: _profile }) {
        // Handle Keycloak role extraction from JWT token and store refresh_token
        if (account?.provider === "keycloak" && account.access_token) {
          try {
            // Decode the access token to extract roles
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion
            const payload = JSON.parse(Buffer.from(account.access_token.split(".")[1], "base64").toString()) as any;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const rolesFromToken: string[] = payload?.realm_access?.roles || [];
            const roles: RoleEnum[] = rolesFromToken
              .map((v: string) => RoleType.parse(v)?.enum)
              .filter(typeofEnum(RoleEnum));

            // Store roles and refresh_token in the token for use in signIn callback and logout
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            (token as any).keycloakRoles = roles;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            (token as any).refreshToken = account.refresh_token;
            logger.debug(`Extracted roles from Keycloak token: ${roles.join(", ")}`);
          } catch (error) {
            logger.warn("Failed to decode Keycloak access token for role extraction", error);
          }
        }
        return token;
      },
      async signIn({ user, account, profile: _profile }) {
        // Handle role management for Keycloak users
        if (account?.provider === "keycloak" && user.email) {
          try {
            // Get roles from the JWT token (processed in jwt callback)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const tokenWithRoles = account as any;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const roles: RoleEnum[] = tokenWithRoles.keycloakRoles || [];

            // Find existing user
            const existingUser = await prismaService.prisma.user.findFirst({
              where: {
                OR: [
                  { email: user.email },
                  { accounts: { some: { provider: "keycloak", providerAccountId: account.providerAccountId } } },
                ],
              },
              include: { accounts: { where: { provider: "keycloak" } } },
            });

            if (existingUser) {
              // Update existing user with roles if passRoles is enabled
              if (configService.keycloak.passRoles) {
                const updatedUser = await prismaService.prisma.user.update({
                  where: { id: existingUser.id },
                  data: {
                    name: user.name || existingUser.name,
                    email: user.email,
                    emailVerified: ("emailVerified" in user ? user.emailVerified : null) || existingUser.emailVerified,
                    role: roles.join(" ") || "",
                  },
                });

                await subscriptionService.publish("User", {
                  topic: "User",
                  id: updatedUser.id,
                  mutation: Mutation.Updated,
                });
                await subscriptionService.publish(`User/${updatedUser.id}`, {
                  topic: "User",
                  id: updatedUser.id,
                  mutation: Mutation.Updated,
                });

                logger.debug(`Updated existing user roles: ${roles.join(", ")}`);
              }
            } else {
              // Create new user with appropriate roles
              const roleToSet = configService.keycloak.passRoles
                ? roles.join(" ") || ""
                : (RoleType.parse(configService.keycloak.defaultRole ?? "")?.enum ?? "");

              const newUser = await prismaService.prisma.user.create({
                data: {
                  name: user.name || "",
                  email: user.email,
                  emailVerified: "emailVerified" in user ? user.emailVerified : null,
                  password: randomUUID(),
                  role: roleToSet,
                },
              });

              await subscriptionService.publish("User", {
                topic: "User",
                id: newUser.id,
                mutation: Mutation.Created,
              });

              logger.debug(`Created new user with role: ${roleToSet}`);
            }
          } catch (error) {
            logger.error("Error managing user roles during AuthJS signIn", error);
          }
        }
        return true;
      },
      async session({ session }) {
        // Ensure session includes updated user information
        if (session.user?.email) {
          try {
            const user = await prismaService.prisma.user.findUnique({
              where: { email: session.user.email },
              omit: { password: true },
            });

            if (user) {
              // Update session with current user data including roles
              session.user = {
                ...session.user,
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                // Add role as a custom property
                ...({ role: user.role ?? "" }),
              };
            }
          } catch (error) {
            logger.warn("Failed to update session with user data", error);
          }
        }
        return session;
      },
    },
    cookies: {
      sessionToken: {
        name: `${configService.nodeEnv === "production" ? "__Secure-" : ""}next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: true,
        },
      },
      callbackUrl: {
        name: `${configService.nodeEnv === "production" ? "__Secure-" : ""}next-auth.callback-url`,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: true,
        },
      },
      csrfToken: {
        name: `${configService.nodeEnv === "production" ? "__Host-" : ""}next-auth.csrf-token`,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: true,
        },
      },
      pkceCodeVerifier: {
        name: `${configService.nodeEnv === "production" ? "__Secure-" : ""}next-auth.pkce.code_verifier`,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: true,
          maxAge: 60 * 15, // 15 minutes
        },
      },
      state: {
        name: `${configService.nodeEnv === "production" ? "__Secure-" : ""}next-auth.state`,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: true,
          maxAge: 60 * 15, // 15 minutes
        },
      },
      nonce: {
        name: `${configService.nodeEnv === "production" ? "__Secure-" : ""}next-auth.nonce`,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: true,
        },
      },
    },
    debug: configService.auth.debug || configService.nodeEnv !== "production",
    events: {
      async signOut(message) {
        // Perform federated logout with Keycloak when user signs out
        const token = "token" in message ? message.token : null;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const refreshToken: string | undefined = token ? (token as any).refreshToken : undefined;

        if (refreshToken) {
          try {
            const endSessionURL = `${configService.keycloak.issuerUrl}/protocol/openid-connect/logout`;
            const body = new URLSearchParams({
              client_id: configService.keycloak.clientId,
              client_secret: configService.keycloak.clientSecret,
              refresh_token: refreshToken,
            });

            const response = await fetch(endSessionURL, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: body.toString(),
            });

            if (!response.ok) {
              logger.warn(`Keycloak logout failed with status: ${response.status}`);
            } else {
              logger.debug("Successfully logged out from Keycloak");
            }
          } catch (error) {
            logger.error("Error during Keycloak federated logout", error);
          }
        }
      },
    },
    providers: authService
      .getProviderNames()
      .map((name) => authService.getProvider(name))
      .filter((provider) => typeofObject<AuthjsProvider>(provider, (p) => "create" in p))
      .map((provider) => provider.create()),
    redirectProxyUrl: configService.cors.origin,
    secret: configService.jwt.secret,
    session: {
      maxAge: configService.session.maxAge,
      strategy: validateStore(configService.session.store),
      updateAge: 0,
    },
    trustHost: true,
  };
};
