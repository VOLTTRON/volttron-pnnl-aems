import { NextRequest, NextResponse } from "next/server";

import { LogoutResponse, getProvider, getProviderNames } from "@/auth";
import { HttpStatus } from "@/common";

const handleRequest = async (req: NextRequest) => {
  const providers = getProviderNames();
  const responses: (LogoutResponse | undefined)[] = [];
  for (const name of providers) {
    const provider = getProvider(name);
    const response = await provider?.logout?.(req);
    responses.push(response);
  }
  const redirect = responses.find((r) => r?.redirect)?.redirect;
  const response = responses.find((r) => r);
  if (redirect) {
    return NextResponse.redirect(new URL(redirect), HttpStatus.Found);
  } else if (response) {
    return NextResponse.json(HttpStatus.OK, HttpStatus.OK);
  } else {
    return NextResponse.json(HttpStatus.Unauthorized, HttpStatus.Unauthorized);
  }
};

export { handleRequest as POST, handleRequest as GET };
