import { generateState, OAuth2Provider, Tokens } from "arctic";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { parseJWT } from "oslo/jwt";
import { OAuth2Client, OAuth2RequestError } from "oslo/oauth2";
import { prisma } from "@/prisma";
import { authUser, registerProvider } from "@/auth";
import { lucia } from "../../lucia";
import axios from "axios";
import { logger } from "@/logging";
import { isString } from "lodash";
import { provider } from "./info";
import { NextRequest, NextResponse } from "next/server";
import { HttpStatus, RoleType } from "@/common";
import { pubsub } from "@/graphql/pubsub";
import { Mutation } from "@/graphql/types";

export class OneID implements OAuth2Provider {
  private client;
  private clientSecret;
  readonly authorizeEndpoint;
  readonly tokenEndpoint;
  readonly profileEndpoint;

  constructor(
    authorizeEndpoint: string,
    tokenEndpoint: string,
    profileEndpoint: string,
    clientId: string,
    clientSecret: string,
    options?: {
      redirectURI?: string;
    }
  ) {
    this.authorizeEndpoint = authorizeEndpoint;
    this.tokenEndpoint = tokenEndpoint;
    this.profileEndpoint = profileEndpoint;
    this.client = new OAuth2Client(clientId, authorizeEndpoint, tokenEndpoint, {
      redirectURI: options?.redirectURI,
    });
    this.clientSecret = clientSecret;
  }
  async createAuthorizationURL(
    state: string,
    options?: {
      scopes?: string[];
    }
  ): Promise<URL> {
    return await this.client.createAuthorizationURL({
      state,
      scopes: options?.scopes ?? [],
    });
  }
  async validateAuthorizationCode(code: string): Promise<Tokens> {
    const result = await this.client.validateAuthorizationCode(code, {
      authenticateWith: "request_body",
      ...(this.clientSecret && { credentials: this.clientSecret }),
    });
    const tokens = {
      accessToken: result.access_token,
    };
    return tokens;
  }
}

export interface OneidUser {
  duid: string;
  name: string;
  email: string;
}

export class Singleton {
  private static instance: Singleton;

  private oneid: OneID | undefined;

  public static getInstance(): Singleton {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }

  public async getOneId() {
    if (!this.oneid) {
      const url = new URL(".well-known/openid-configuration", process.env.ONEID_ISSUER_URL ?? "");
      const response = await axios.get(url.toString());
      if (
        !(
          response &&
          isString(response.data.authorization_endpoint) &&
          isString(response.data.token_endpoint) &&
          isString(response.data.userinfo_endpoint)
        )
      ) {
        throw new Error(`Invalid or no response from: ${url}`);
      }
      this.oneid = new OneID(
        response.data.authorization_endpoint,
        response.data.token_endpoint,
        response.data.userinfo_endpoint,
        process.env.ONEID_CLIENT_ID ?? "",
        process.env.ONEID_CLIENT_SECRET ?? "",
        {
          redirectURI: process.env.ONEID_REDIRECT_URL,
        }
      );
    }
    return this.oneid;
  }
}

registerProvider({
  ...provider,
  callback: async (req: Request) => {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = cookies().get("oneid_oauth_state")?.value ?? null;
    if (!code || !state || !storedState || state !== storedState) {
      return NextResponse.json(
        { ...HttpStatus.BadRequest, error: "Callback code or state missing or incorrect" },
        HttpStatus.BadRequest
      );
    }
    try {
      const oneid = await Singleton.getInstance().getOneId();
      const tokens = await oneid.validateAuthorizationCode(code);
      const jwt = parseJWT(tokens.accessToken);
      let oneidUser: OneidUser | undefined = jwt?.payload as any;
      if (!oneidUser) {
        const profileResponse = await fetch(oneid.profileEndpoint, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });
        oneidUser = await profileResponse.json();
      }
      const { duid, name, email } = oneidUser ?? {};
      if (!(duid && name && email)) {
        logger.warn("Invalid user data", oneidUser);
        return NextResponse.json(
          { ...HttpStatus.BadGateway, error: "OneID JWT token missing duid, name, and/or email" },
          HttpStatus.BadGateway
        );
      }
      let user = await prisma.user.findFirst({
        where: { OR: [{ email: email }, { accounts: { some: { provider: "oneid", providerAccountId: duid } } }] },
        include: { accounts: { where: { provider: "oneid" } } },
      });
      if (user) {
        if (name !== user.name || email !== user.email) {
          user = await prisma.user
            .update({
              where: { id: user.id },
              data: {
                name: name,
                email: email,
              },
              include: { accounts: { where: { provider: "oneid" } } },
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
              password: randomUUID(),
              role: RoleType.parse(process.env.ONEID_DEFAULT_ROLE ?? "")?.enum ?? "",
            },
            include: { accounts: { where: { provider: "oneid" } } },
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
              provider: "oneid",
              providerAccountId: duid,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              sessionState: state,
              user: { connect: { id: user.id } },
            },
            include: { user: { include: { accounts: { where: { provider: "oneid" } } } } },
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
      return NextResponse.json(HttpStatus.OK, HttpStatus.OK);
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
      where: { userId: user.id, provider: "oneid" },
    });
    const url = new URL(`${process.env.ONEID_REALM_URL}/protocol/openid-connect/logout`);
    if (process.env.ONEID_CLIENT_ID) {
      url.searchParams.set("client_id", process.env.ONEID_CLIENT_ID);
    }
    if (account?.refreshToken) {
      url.searchParams.set("refresh_token", account.refreshToken);
    }
    return { redirect: url.toString() };
  },
  authorize: async (_values) => {
    const state = generateState();
    const oneid = await Singleton.getInstance().getOneId();
    const url = await oneid.createAuthorizationURL(state, { scopes: ["profile"] });
    return {
      cookies: [
        [
          "oneid_oauth_state",
          state,
          {
            path: "/",
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 60 * 10,
            sameSite: "lax",
          },
        ],
      ],
      redirect: url.toString(),
    };
  },
});
