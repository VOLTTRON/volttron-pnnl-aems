import axios from "axios";
import { NextRequest } from "next/server";

import { authUser } from "@/auth/server";
import { logger } from "@/logging";
import { delay } from "@/utils/util";

const availableServices = (process.env.AVAILABLE_SERVICES ?? "").split(/[,; ]+/i);

const handleRequest = async (req: NextRequest) => {
  const auth = await authUser();
  if (!auth.roles.user) {
    return new Response(null, {
      status: 401,
    });
  }
  if (req.method === "GET") {
    return Response.json(
      {
        autoComplete: !!process.env.NOMINATIM_PRIVATE_API_URL,
        addressSearch: !!process.env.NOMINATIM_PUBLIC_API_URL,
      },
      { status: 200 }
    );
  } else if (req.method === "POST") {
    const body = await req.text();
    if (body.length < 3) {
      return Response.json([]);
    }
    const url = `${
      (process.env.NOMINATIM_PRIVATE_API_URL || process.env.NOMINATIM_PUBLIC_API_URL) ?? ""
    }/search?q=${body}&format=jsonv2`;
    if (!availableServices.includes("nom")) {
      // pause so that we don't exceed the API rate limit
      await delay(1000);
    }
    return axios({
      method: "get",
      url: url,
    })
      .then(({ data }) => {
        return Response.json(data);
      })
      .catch((error: any) => {
        logger.debug(error, url);
        return new Response(null, {
          status: 404,
        });
      });
  } else {
    return new Response(null, { status: 404 });
  }
};

export { handleRequest as GET, handleRequest as POST };
