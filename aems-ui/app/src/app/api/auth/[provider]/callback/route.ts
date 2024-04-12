import { NextRequest } from "next/server";

import { getProvider } from "@/auth/server";

const handleRequest = async (req: NextRequest, { params }: { params: { provider: string } }) => {
  const provider = getProvider(params.provider ?? "");
  if (!provider || !provider.callback) {
    return new Response(null, { status: 404 });
  }
  return await provider.callback(req);
};

export { handleRequest as GET };
