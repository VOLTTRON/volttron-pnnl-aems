"use server";

import { pick } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth";
import { logger } from "@/logging";
import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authUser(req);
  if (!user.roles.user) {
    return res.status(401).json(null);
  }
  const { id } = user;
  if (req.method === "PUT") {
    const user = req.body as Prisma.UserUpdateInput;
    return prisma.user
      .update({
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
        data: pick(user, ["password", "preferences"]),
        where: { id: id },
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
      .findFirst({
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
        where: { id: id },
      })
      .then((user) => {
        if (!user) {
          return res.status(404).json("User not found.");
        }
        return res.status(200).json(user);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "DELETE") {
    return prisma.user
      .delete({
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
        where: { id: id },
      })
      .then(() => {
        return res.status(200).json(true);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else {
    return res.status(404).json(null);
  }
}