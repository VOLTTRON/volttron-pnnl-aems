"use server";

import { merge } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth";
import { logger } from "@/logging";
import { convertToJsonObject, prisma, recordChange } from "@/prisma";
import { Setpoints } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authUser(req);
  if (!user.roles.user) {
    return res.status(401).json(null);
  }
  if (req.method === "POST") {
    if (!user.roles.admin) {
      return res.status(401).json(null);
    }
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
      .then((response) => {
        recordChange("Create", "Setpoints", response.id.toString(), user, convertToJsonObject(response));
        return res.status(201).json(response);
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
