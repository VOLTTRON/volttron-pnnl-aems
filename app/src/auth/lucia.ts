import { pick } from "lodash";
import { Lucia, TimeSpan } from "lucia";
import { prisma } from "@/prisma";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { User } from "@prisma/client";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

const lucia = new Lucia(adapter, {
  sessionExpiresIn: new TimeSpan(parseInt(process.env.SESSION_MAX_AGE ?? "2592000"), "s"),
  sessionCookie: {
    expires: false,
    attributes: {
      // set to `true` when using HTTPS
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (user) => pick(user, ["id", "name", "email", "role"]),
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: Pick<User, "id" | "name" | "email" | "role">;
  }
}

export { lucia, adapter };
