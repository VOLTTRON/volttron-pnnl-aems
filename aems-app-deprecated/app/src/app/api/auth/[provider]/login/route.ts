import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { authUser, getProvider } from "@/auth";
import { lucia } from "@/auth/lucia";
import { HttpStatus } from "@/common";

const handleRequest = async (req: NextRequest, { params }: { params: { provider: string } }) => {
  const provider = getProvider(params.provider ?? "");
  if (!provider) {
    return NextResponse.json(HttpStatus.NotFound, HttpStatus.NotFound);
  }
  const body = await req.json();
  const auth = await authUser();
  const response = await provider.authorize(body, { auth });
  if (response.user?.id) {
    const session = await lucia.createSession(response.user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  }
  response.cookies?.forEach((cookie) => cookies().set(...cookie));
  if (response.redirect) {
    return NextResponse.redirect(new URL(response.redirect), HttpStatus.Found);
  } else if (response.user) {
    return NextResponse.json(HttpStatus.OK, HttpStatus.OK);
  } else {
    return NextResponse.json({ ...HttpStatus.Unauthorized, error: response.error }, HttpStatus.Unauthorized);
  }
};

export { handleRequest as POST };
