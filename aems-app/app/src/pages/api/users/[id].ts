"use server";

import { isArray, isNil, pick } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth";
import { logger } from "@/logging";
import { convertToJsonObject, prisma, recordChange } from "@/prisma";
import { Prisma } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authUser(req);
  if (!user.roles.admin) {
    return res.status(401).json(null);
  }
  const { id } = req.query;
  if (isArray(id) || isNil(id)) {
    return res.status(400).json("ID must be specified.");
  }
  if (req.method === "PUT") {
    const input = req.body as Prisma.UserUpdateInput;
    const units = input.units as { id: number }[] | undefined;
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
        data: {
          ...pick(input, ["name", "email", "role", "password", "preferences"]),
          ...(units !== undefined && { units: { connect: units } }),
        },
        where: { id: id },
      })
      .then((response) => {
        recordChange("Update", "User", id, user, convertToJsonObject(response));
        return res.status(200).json(response);
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
        recordChange("Delete", "User", id!, user);
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
