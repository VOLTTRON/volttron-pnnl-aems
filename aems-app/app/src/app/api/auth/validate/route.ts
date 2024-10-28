import { NextRequest, NextResponse } from "next/server";

import authUser from "@/auth/authUser";
import { HttpStatus } from "@/common";

const handleRequest = async (_req: NextRequest) => {
  const user = await authUser();
  const roles = user.id
    ? Object.entries(user.roles)
        .filter(([_k, v]) => v)
        .map(([k, _v]) => k)
        .join(" ")
    : undefined;
  return NextResponse.json(
    {
      role: roles,
      scope: roles,
    },
    HttpStatus.OK
  );
};

export { handleRequest as GET };
