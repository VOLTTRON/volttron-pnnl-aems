"use server";

import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth";
import { logger } from "@/logging";
import { convertToJsonObject, prisma, recordChange } from "@/prisma";
import { enum_holiday, Holidays } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authUser(req);
  if (!user.roles.user) {
    return res.status(401).json(null);
  }
  if (req.method === "POST") {
    if (!user.roles.admin) {
      return res.status(401).json(null);
    }
    const holiday = req.body as Partial<Holidays> & {
      configurationId?: number;
    };
    const { configurationId } = holiday;
    return prisma.holidays
      .create({
        data: {
          type: enum_holiday.Custom,
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
      .then((response) => {
        recordChange("Create", "Holidays", response.id.toString(), user, convertToJsonObject(response));
        return res.status(201).json(response);
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
        orderBy: [{ day: "asc" }, { month: "asc" }],
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
