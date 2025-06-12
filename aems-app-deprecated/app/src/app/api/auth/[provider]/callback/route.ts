import { NextRequest, NextResponse } from "next/server";

import { getProvider } from "@/auth";
import { HttpStatus } from "@/common";

const handleRequest = async (req: NextRequest, { params }: { params: { provider: string } }) => {
  const provider = getProvider(params.provider ?? "");
  if (!provider || !provider.callback) {
    return NextResponse.json(HttpStatus.NotFound, HttpStatus.NotFound);
  }
  return await provider.callback(req);
};

export { handleRequest as GET };
