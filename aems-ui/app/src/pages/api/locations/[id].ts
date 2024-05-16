"use server";

import { isArray, isNil } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth/server";
import { logger } from "@/logging";
import prisma from "@/prisma";
import { Locations } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authUser(req);
  if (!user.roles.user) {
    return res.status(401).json(null);
  }
  const { id } = req.query;
  if (isArray(id) || isNil(id)) {
    return res.status(400).json("ID must be specified.");
  }
  if (req.method === "GET") {
    return prisma.locations
      .findFirst({
        where: { id: parseInt(id) },
        include: {
          _count: {
            select: {
              units: true,
            },
          },
        },
      })
      .then((location) => {
        if (!location) {
          return res.status(404).json("Location not found.");
        }
        return res.status(200).json(location);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "PUT") {
    if (!user.roles.admin) {
      return res.status(401).json(null);
    }
    const location = req.body as Partial<Locations>;
    return prisma.locations
      .update({
        data: location,
        where: { id: parseInt(id) },
      })
      .then((location) => {
        if (!location) {
          return res.status(404).json("Location not found.");
        }
        return res.status(200).json(location);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "DELETE") {
    if (!user.roles.admin) {
      return res.status(401).json(null);
    }
    return prisma.locations
      .delete({
        where: { id: parseInt(id) },
      })
      .then((location) => {
        if (!location) {
          return res.status(404).json("Location not found.");
        }
        return res.status(200).json(null);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else {
    return res.status(404).json(null);
  }
}
