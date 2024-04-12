import { cookies } from "next/headers";
import { NextRequest } from "next/server";

import { authUser } from "@/auth/server";
import { lucia } from "@/auth/lucia";

const handleRequest = async (_req: NextRequest) => {
  const user = await authUser();
  if (user) {
    await lucia.invalidateUserSessions(user.id ?? "");
    const sessionCookie = lucia.createBlankSessionCookie();
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    return new Response(null, { status: 200 });
  } else {
    return new Response(null, { status: 403 });
  }
};

export { handleRequest as POST };
