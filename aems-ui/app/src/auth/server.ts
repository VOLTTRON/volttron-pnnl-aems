import { NextApiRequest } from "next";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

import { lucia } from "./lucia";
import { AuthUser, Credentials, Provider } from "./types";
import { authRoles, authenticate, available } from ".";
import { deepFreeze } from "@/utils/util";

const providers: Map<string, Provider<Credentials>> = new Map<string, Provider<Credentials>>();

const getProvider = (name: string) => {
  const provider = providers.get(name);
  return provider ? (deepFreeze(provider) as Readonly<Provider<Credentials>>) : undefined;
};

const getProviders = () => deepFreeze(available) as Readonly<string[]>;

const registerProvider = (provider: Provider<Credentials>) => providers.set(provider.name, provider);

const authUser = async (req?: NextApiRequest | NextRequest): Promise<AuthUser> => {
  let id: string | undefined = undefined;
  let role: string | undefined = undefined;
  if (authenticate) {
    let sessionId: string | null | undefined = undefined;
    let authorization: string | null | undefined = undefined;
    if (req instanceof NextRequest) {
      sessionId = req.cookies.get(lucia.sessionCookieName)?.value ?? null;
      authorization = req.cookies.get("Authorization")?.value ?? null;
    } else if (req !== undefined) {
      sessionId = req.cookies[lucia.sessionCookieName] ?? null;
      authorization = req.cookies["Authorization"] ?? null;
    } else {
      sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
      authorization = cookies().get("Authorization")?.value ?? null;
    }
    if (sessionId === null && authorization !== null && available.includes("bearer")) {
      sessionId = lucia.readBearerToken(authorization);
    }
    if (sessionId) {
      const { session, user } = await lucia.validateSession(sessionId);
      if (session && user) {
        id = user.id;
        role = user.role ?? undefined;
      }
    }
  }
  return {
    id,
    roles: authRoles(role ?? ""),
  };
};

export { authUser, getProvider, getProviders, registerProvider };

import("./providers");
