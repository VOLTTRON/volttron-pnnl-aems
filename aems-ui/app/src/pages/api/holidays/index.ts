"use server";

import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth/server";
import { logger } from "@/logging";
import prisma from "@/prisma";
import { Holiday_type, Holidays } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authUser(req);
  if (!user.roles.user) {
    return res.status(401).json(null);
  }
  if (req.method === "POST") {
    const holiday = req.body as Partial<Holidays> & { configurationId?: number };
    const { configurationId } = holiday;
    return prisma.holidays
      .create({
        data: {
          type: Holiday_type.Custom,
          label: holiday.label ?? "",
          month: holiday.month,
          day: holiday.day,
          observance: holiday.observance,
          ...(configurationId !== undefined && {
            configurations: {
              connect: {
                id: configurationId,
              },
            },
          }),
        },
      })
      .then((holiday) => {
        return res.status(201).json(holiday);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "GET") {
    return prisma.holidays
      .findMany({
        include: {
          _count: {
            select: {
              configurations: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
      .then((holidays) => {
        return res.status(200).json(holidays);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else {
    return res.status(404).json(null);
  }
}
