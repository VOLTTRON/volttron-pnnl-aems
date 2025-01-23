import { NextRequest, NextResponse } from "next/server";

import { getProvider } from "@/auth";
import { HttpStatus } from "@/common";

const handleRequest = async (req: NextRequest, { params }: { params: { provider: string } }) => {
  const provider = getProvider(params.provider ?? "");
  if (!provider) {
    return NextResponse.json(HttpStatus.NotFound, HttpStatus.NotFound);
  }
  const response = await provider?.logout?.(req);
  if (response?.redirect) {
    return NextResponse.redirect(new URL(response.redirect), HttpStatus.Found);
  } else if (response) {
    return NextResponse.json(HttpStatus.OK, HttpStatus.OK);
  } else {
    return NextResponse.json(HttpStatus.Unauthorized, HttpStatus.Unauthorized);
  }
};

export { handleRequest as POST, handleRequest as GET };
