import { generateState, generateCodeVerifier, Keycloak } from "arctic";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { parseJWT } from "oslo/jwt";
import { OAuth2RequestError } from "oslo/oauth2";
import { prisma } from "@/prisma";
import { authUser, registerProvider } from "@/auth";
import { lucia } from "../../lucia";
import { logger } from "@/logging";
import { provider } from "./info";
import { NextRequest, NextResponse } from "next/server";
import { HttpStatus, RoleType } from "@/common";
import { pubsub } from "@/graphql/pubsub";
import { Mutation } from "@/graphql/types";

export interface KeycloakUser {
  // keys
  id: string;
  sub: string;
  // email
  email: string;
  email_verified: boolean;
  // name
  username: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  full_name?: string;
}

export class Singleton {
  private static instance: Singleton;

  private keycloak: Keycloak | undefined;
  private internal: Keycloak | undefined;

  public static getInstance(): Singleton {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }

  public async getKeycloak() {
    if (!this.keycloak) {
      this.keycloak = new Keycloak(
        process.env.KEYCLOAK_REALM_URL ?? "",
        process.env.KEYCLOAK_CLIENT_ID ?? "",
        process.env.KEYCLOAK_CLIENT_SECRET ?? "",
        process.env.KEYCLOAK_REDIRECT_URL ?? ""
      );
    }
    return this.keycloak;
  }

  public async getInternal() {
    if (!this.internal) {
      this.internal = new Keycloak(
        (process.env.KEYCLOAK_INTERNAL_REALM_URL || process.env.KEYCLOAK_REALM_URL) ?? "",
        process.env.KEYCLOAK_CLIENT_ID ?? "",
        process.env.KEYCLOAK_CLIENT_SECRET ?? "",
        process.env.KEYCLOAK_REDIRECT_URL ?? ""
      );
    }
    return this.internal;
  }
}

registerProvider({
  ...provider,
  callback: async (req: Request) => {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = cookies().get("keycloak_oauth_state")?.value ?? null;
    const storedCodeVerifier = cookies().get("keycloak_code_verifier")?.value ?? null;
    if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
      return NextResponse.json(
        { ...HttpStatus.BadRequest, error: "Callback code or state missing or incorrect" },
        HttpStatus.BadRequest
      );
    }
    try {
      const keycloak = await Singleton.getInstance().getInternal();
      const tokens = await keycloak.validateAuthorizationCode(code, storedCodeVerifier);
      const jwt = parseJWT(tokens.accessToken);
      logger.info(jwt);
      const keycloakUser: KeycloakUser | undefined = jwt?.payload as any;
      const id = keycloakUser?.sub || keycloakUser?.id;
      const name =
        keycloakUser?.preferred_username ||
        `${keycloakUser?.given_name} ${keycloakUser?.family_name}`.trim() ||
        keycloakUser?.full_name ||
        keycloakUser?.name ||
        keycloakUser?.username;
      const { email, email_verified } = keycloakUser ?? {};
      if (!id || !name || !email) {
        logger.warn("Invalid Keycloak user", keycloakUser);
        return NextResponse.json(
          { ...HttpStatus.BadGateway, error: "Keycloak JWT token missing sub, name, and/or email" },
          HttpStatus.BadGateway
        );
      }
      let user = await prisma.user.findFirst({
        where: { OR: [{ email: email }, { accounts: { some: { provider: "keycloak", providerAccountId: id } } }] },
        include: { accounts: { where: { provider: "keycloak" } } },
      });
      if (user) {
        if (name !== user.name || email !== user.email || email_verified !== !!user.emailVerified) {
          user = await prisma.user
            .update({
              where: { id: user.id },
              data: {
                name: name,
                email: email,
                emailVerified: email_verified ? new Date() : null,
              },
              include: { accounts: { where: { provider: "keycloak" } } },
            })
            .then((user) => {
              pubsub.publish("User", { topic: "User", id: user.id, mutation: Mutation.Updated });
              pubsub.publish(`User/${user.id}`, { topic: "User", id: user.id, mutation: Mutation.Updated });
              return user;
            });
        }
      } else {
        user = await prisma.user
          .create({
            data: {
              name: name,
              email: email,
              emailVerified: email_verified ? new Date() : null,
              password: randomUUID(),
              role: RoleType.parse(process.env.KEYCLOAK_DEFAULT_ROLE ?? "")?.enum ?? "",
            },
            include: { accounts: { where: { provider: "keycloak" } } },
          })
          .then((user) => {
            pubsub.publish("User", { topic: "User", id: user.id, mutation: Mutation.Created });
            return user;
          });
      }
      if (!user) {
        throw new Error("Failed to update or create user");
      }
      if (!user.accounts) {
        const value = await prisma.account
          .create({
            data: {
              type: "oauth",
              provider: "keycloak",
              providerAccountId: id,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              sessionState: state,
              user: { connect: { id: user.id } },
            },
            include: { user: { include: { accounts: { where: { provider: "keycloak" } } } } },
          })
          .then((account) => {
            pubsub.publish("Account", { topic: "Account", id: account.id, mutation: Mutation.Created });
            return account;
          });
        user = value.user;
      }
      const session = await lucia.createSession(user.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
      return NextResponse.json(HttpStatus.Found, {
        ...HttpStatus.Found,
        headers: {
          Location: "/",
        },
      });
    } catch (e) {
      if (e instanceof OAuth2RequestError) {
        logger.debug(e, url.toString());
        return NextResponse.json(HttpStatus.Unauthorized, HttpStatus.Unauthorized);
      }
      logger.warn(e);
      return NextResponse.json(HttpStatus.BadGateway, HttpStatus.BadGateway);
    }
  },
  logout: async (req: NextRequest) => {
    const user = await authUser(req);
    const account = await prisma.account.findFirst({
      where: { userId: user.id, provider: "keycloak" },
    });
    const url = new URL(`${process.env.KEYCLOAK_REALM_URL}/protocol/openid-connect/logout`);
    if (process.env.KEYCLOAK_CLIENT_ID) {
      url.searchParams.set("client_id", process.env.KEYCLOAK_CLIENT_ID);
    }
    if (account?.refreshToken) {
      url.searchParams.set("refresh_token", account.refreshToken);
    }
    return { redirect: url.toString() };
  },
  authorize: async (_values) => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const keycloak = await Singleton.getInstance().getKeycloak();
    const url = await keycloak.createAuthorizationURL(state, codeVerifier, { scopes: ["profile", "email"] });
    return {
      cookies: [
        [
          "keycloak_oauth_state",
          state,
          {
            path: "/",
            secure: process.env.NODE_ENV === "production",
            httpOnly: false,
            maxAge: 60 * 10,
            sameSite: true,
          },
        ],
        [
          "keycloak_code_verifier",
          codeVerifier,
          {
            path: "/",
            secure: process.env.NODE_ENV === "production",
            httpOnly: false,
            maxAge: 60 * 10,
            sameSite: true,
          },
        ],
      ],
      redirect: url.toString(),
    };
  },
});
