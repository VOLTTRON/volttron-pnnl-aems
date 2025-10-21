import { AuthUser } from "./types";
import { lucia } from "./lucia";
import { cookies } from "next/headers";
import { NextApiRequest } from "next";
import { NextRequest } from "next/server";
import authRoles from "./authRoles";
import { parseBoolean } from "@/utils/util";
import { IncomingMessage } from "http";
import { parseCookie } from "next/dist/compiled/@edge-runtime/cookies";

const authenticate = parseBoolean(process.env.AUTHENTICATE);

const providerNames = (process.env.AUTH_PROVIDERS ?? "")
  .split(/[, |]+/)
  .map((v) => v.trim())
  .filter((v) => v.length > 0);

const authUser = async (req?: NextApiRequest | NextRequest | IncomingMessage): Promise<AuthUser> => {
  let id: string | undefined = undefined;
  let role: string | undefined = undefined;
  if (authenticate) {
    let sessionId: string | null | undefined = undefined;
    let authorization: string | null | undefined = undefined;
    if (req instanceof NextRequest) {
      sessionId = req.cookies.get(lucia.sessionCookieName)?.value ?? null;
      authorization = req.cookies.get("Authorization")?.value ?? null;
    } else if (req?.hasOwnProperty("cookies")) {
      sessionId = (req as NextApiRequest).cookies[lucia.sessionCookieName] ?? null;
      authorization = (req as NextApiRequest).cookies["Authorization"] ?? null;
    } else if (req instanceof IncomingMessage) {
      const cookie = parseCookie(req.headers.cookie ?? "");
      sessionId = cookie.get(lucia.sessionCookieName) ?? null;
      authorization = cookie.get("Authorization") ?? null;
    } else {
      sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
      authorization = cookies().get("Authorization")?.value ?? null;
    }
    if (sessionId === null && authorization !== null && providerNames.includes("bearer")) {
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

export default authUser;
