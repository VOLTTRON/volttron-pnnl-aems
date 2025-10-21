import { deepFreeze, parseBoolean } from "@/utils/util";

import { AuthUser, Credentials, ProviderInfo, Values } from "./types";
import { logger } from "@/logging";
import { NextApiRequest, NextApiResponse } from "next";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { NextRequest } from "next/server";
import { User } from "lucia";

const authenticate = parseBoolean(process.env.AUTHENTICATE);

export interface AuthResponse {
  user?: User;
  cookies?: [key: string, value: string, cookie?: Partial<ResponseCookie> | undefined][] | [options: ResponseCookie][];
  redirect?: string;
  error?: string;
}

export interface NextHandler {
  <HandlerReq extends NextApiRequest>(req: HandlerReq, res: NextApiResponse): Promise<unknown>;
  <HandlerReqAlt extends NextRequest | Request>(req: HandlerReqAlt, res?: undefined): Promise<Response>;
}
export type callback = NextHandler;

export interface LogoutResponse {
  redirect?: string;
}

export interface LogoutHandler {
  <HandlerReq extends NextApiRequest>(req: HandlerReq, res: NextApiResponse): Promise<LogoutResponse>;
  <HandlerReqAlt extends NextRequest | Request>(req: HandlerReqAlt, res?: undefined): Promise<LogoutResponse>;
}
export type logout = LogoutHandler;

export type authorize<T extends Credentials, V extends Values<T>> = (
  credentials: V | null | undefined,
  options: { auth: AuthUser }
) => Promise<AuthResponse>;

export interface Provider<T extends Credentials> extends ProviderInfo<T> {
  callback?: callback;
  logout?: logout;
  authorize: authorize<T, Values<T>>;
}

const infos: Map<string, ProviderInfo<Credentials>> = new Map<string, ProviderInfo<Credentials>>();

const getProviderInfo = (name: string) => {
  const provider = infos.get(name);
  return provider && getProviderNames().includes(name)
    ? (deepFreeze(provider) as Readonly<ProviderInfo<Credentials>>)
    : undefined;
};

const getProviderNames = () =>
  (process.env.AUTH_PROVIDERS ?? "")
    .split(/[, |]+/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);

const isAuthenticate = authenticate;

const registerProviderInfo = (provider: ProviderInfo<Credentials>) => {
  infos.set(provider.name, provider);
  logger.info(`Registered provider info: ${provider.name}`);
  logger.debug({ provider });
};

const providers: Map<string, Provider<Credentials>> = new Map<string, Provider<Credentials>>();

const getProvider = (name: string) => {
  const provider = providers.get(name);
  return provider && getProviderNames().includes(name)
    ? (deepFreeze(provider) as Readonly<Provider<Credentials>>)
    : undefined;
};

const registerProvider = (provider: Provider<Credentials>) => {
  providers.set(provider.name, provider);
  logger.info(`Registered provider: ${provider.name}`);
  logger.debug({ provider, authorize: !!provider.authorize, callback: !!provider.callback });
};

export { isAuthenticate, getProviderInfo, getProviderNames, registerProviderInfo, getProvider, registerProvider };
export { default as authRoles } from "./authRoles";
export { default as authUser } from "./authUser";
export { default as checkPassword } from "./checkPassword";

import("./providers");
