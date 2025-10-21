import { NextRequest, NextResponse } from "next/server";

import { getProviderNames } from "@/auth";
import { HttpStatus } from "@/common";

export const dynamic = "force-dynamic";

const handleRequest = async (_req: NextRequest) => {
  const providers = getProviderNames();
  return NextResponse.json(
    {
      providers,
    },
    HttpStatus.OK
  );
};

export { handleRequest as GET };
