"use server";

import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth/server";
import { logger } from "@/logging";
import prisma from "@/prisma";
import { Prisma } from "@prisma/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await authUser(req);
  if (!user.roles.user) {
    return res.status(401).json(null);
  }
  if (req.method === "POST") {
    const location = req.body as Prisma.LocationsCreateInput;
    return prisma.locations
      .create({
        data: location,
      })
      .then((location) => {
        return res.status(201).json(location);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "GET") {
    return prisma.locations
      .findMany({
        include: {
          _count: {
            select: {
              units: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      })
      .then((locations) => {
        return res.status(200).json(locations);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else {
    return res.status(404).json(null);
  }
}
