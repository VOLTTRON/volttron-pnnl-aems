"use server";

import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth";
import { logger } from "@/logging";
import { prisma } from "@/prisma";
import { Occupancies, Schedules } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authUser(req);
  if (!user.roles.user) {
    return res.status(401).json(null);
  }
  if (req.method === "POST") {
    const occupancy = req.body as Partial<Occupancies> & { schedule?: Schedules; configurationId?: number };
    const { label, date, schedule, configurationId } = occupancy;
    return prisma.occupancies
      .create({
        data: {
          label: label ?? "",
          date: date ?? new Date(),
          ...(schedule && { schedule: { create: schedule } }),
          ...(configurationId !== undefined && {
            configuration: {
              connect: { id: configurationId },
            },
          }),
        },
      })
      .then((occupancy) => {
        return res.status(201).json(occupancy);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "GET") {
    return prisma.occupancies
      .findMany({
        include: {
          schedule: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
      .then((occupancies) => {
        return res.status(200).json(occupancies);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else {
    return res.status(404).json(null);
  }
}
