"use server";

import { merge } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth/server";
import { logger } from "@/logging";
import prisma from "@/prisma";
import { Setpoints } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authUser(req);
  if (!user.roles.user) {
    return res.status(401).json(null);
  }
  if (req.method === "POST") {
    const setpoint = req.body as Partial<Setpoints>;
    return prisma.setpoints
      .create({
        data: merge(
          {
            label: "",
          },
          setpoint
        ),
      })
      .then((setpoint) => {
        return res.status(201).json(setpoint);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "GET") {
    return prisma.setpoints
      .findMany({
        include: {
          _count: {
            select: {
              configurations: true,
              schedules: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
      .then((setpoints) => {
        return res.status(200).json(setpoints);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else {
    return res.status(404).json(null);
  }
}
