"use server";

import { merge } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth/server";
import { logger } from "@/logging";
import prisma from "@/prisma";
import { Schedules } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authUser(req);
  if (!user.roles.user) {
    return res.status(401).json(null);
  }
  if (req.method === "POST") {
    if (!user.roles.admin) {
      return res.status(401).json(null);
    }
    const schedule = req.body as Partial<Schedules>;
    return prisma.schedules
      .create({
        data: merge(
          {
            label: "",
          },
          schedule
        ),
      })
      .then((schedule) => {
        return res.status(201).json(schedule);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "GET") {
    return prisma.schedules
      .findMany({
        include: {
          _count: {
            select: {
              mondayConfigurations: true,
              tuesdayConfigurations: true,
              wednesdayConfigurations: true,
              thursdayConfigurations: true,
              fridayConfigurations: true,
              saturdayConfigurations: true,
              sundayConfigurations: true,
              holidayConfigurations: true,
              occupancies: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
      .then((schedules) => {
        return res.status(200).json(schedules);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else {
    return res.status(404).json(null);
  }
}
