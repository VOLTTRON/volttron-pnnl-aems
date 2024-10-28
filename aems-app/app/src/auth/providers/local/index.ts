import bcrypt from "@node-rs/bcrypt";
import { pick } from "lodash";
import { prisma } from "@/prisma";
import { registerProvider } from "@/auth";
import { provider } from "./info";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { lucia } from "@/auth/lucia";

registerProvider({
  ...provider,
  logout: async (req: NextRequest) => {
    const sessionId: string | null | undefined =
      req.cookies.get(lucia.sessionCookieName)?.value ?? cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (sessionId) {
      await lucia.invalidateSession(sessionId ?? "");
      const sessionCookie = lucia.createBlankSessionCookie();
      cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
    return {};
  },
  authorize: async (values) => {
    // always look up a user and hash passwords to prevent brute force algorithms from determining valid emails by response speed
    const user = await prisma.user.findUnique({ where: { email: values?.email ?? "" } });
    const authorized = await bcrypt.compare(values?.password ?? "", user?.password ?? "");
    if (values?.password && user && authorized) {
      return {
        user: pick(user, ["id", "name", "email", "role"]),
      };
    } else {
      return { error: "Invalid email or password" };
    }
  },
});
