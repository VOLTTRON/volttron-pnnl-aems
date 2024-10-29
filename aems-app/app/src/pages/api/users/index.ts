"use server";

import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth";
import { logger } from "@/logging";
import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authUser(req);
  if (!user.roles.admin) {
    return res.status(401).json(null);
  }
  if (req.method === "POST") {
    const user = req.body as Prisma.UserCreateInput;
    return prisma.user
      .create({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          preferences: true,
          createdAt: true,
          updatedAt: true,
          password: false,
        },
        data: user,
      })
      .then((user) => {
        return res.status(200).json(user);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "GET") {
    return prisma.user
      .findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          preferences: true,
          createdAt: true,
          updatedAt: true,
          password: false,
          units: { select: { id: true } },
        },
        orderBy: {
          name: "asc",
        },
      })
      .then((users) => {
        return res.status(200).json(users);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else {
    return res.status(404).json(null);
  }
}
