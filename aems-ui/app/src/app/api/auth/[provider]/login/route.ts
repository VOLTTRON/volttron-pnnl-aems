import { cookies } from "next/headers";
import { NextRequest } from "next/server";

import { getProvider } from "@/auth/server";
import { lucia } from "@/auth/lucia";

const handleRequest = async (req: NextRequest, { params }: { params: { provider: string } }) => {
  const provider = getProvider(params.provider ?? "");
  if (!provider) {
    return new Response(null, { status: 404 });
  }
  const body = await req.json();
  const response = await provider.authorize(body);
  if (response.user) {
    const session = await lucia.createSession(response.user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    return new Response(null, { status: 200 });
  } else {
    return new Response(null, { status: 403 });
  }
};

export { handleRequest as POST };
