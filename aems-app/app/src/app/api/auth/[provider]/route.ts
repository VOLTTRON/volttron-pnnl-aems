import { NextRequest, NextResponse } from "next/server";

import { getProviderInfo } from "@/auth";
import { HttpStatus } from "@/common";

const handleRequest = async (_req: NextRequest, { params }: { params: { provider: string } }) => {
  const provider = getProviderInfo(params.provider);
  return NextResponse.json(
    {
      provider,
    },
    HttpStatus.OK
  );
};

export { handleRequest as GET };
