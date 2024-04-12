import { NextApiRequest, NextApiResponse } from "next";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { NextRequest } from "next/server";

import { RoleEnum } from "@/common/types";
import { User } from "lucia";

export type CredentialType = "text" | "password";

export type AuthRoles = {
  [key in RoleEnum]: boolean;
};

export interface AuthUser {
  id?: string;
  roles: AuthRoles;
}

export interface AuthResponse {
  user?: User;
  cookie?: [key: string, value: string, cookie?: Partial<ResponseCookie> | undefined] | [options: ResponseCookie];
  redirect?: string;
}

export interface Credential {
  label: string;
  type: CredentialType;
  placeholder?: string;
}

export type Credentials = Record<string, Credential>;

export type Values<T extends Credentials> = { [K in keyof T]: string };

export interface NextHandler {
  <HandlerReq extends NextApiRequest>(req: HandlerReq, res: NextApiResponse): Promise<unknown>;
  <HandlerReqAlt extends NextRequest | Request>(req: HandlerReqAlt, res?: undefined): Promise<Response>;
}
export type callback = NextHandler;

export type authorize<T extends Credentials, V extends Values<T>> = (
  credentials: V | null | undefined
) => Promise<AuthResponse>;

export interface ProviderInfo<T extends Credentials> {
  name: string;
  label: string;
  credentials: T;
}

export interface Provider<T extends Credentials> extends ProviderInfo<T> {
  callback?: callback;
  authorize: authorize<T, Values<T>>;
}
