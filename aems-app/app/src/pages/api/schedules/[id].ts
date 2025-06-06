"use server";

import { isArray, isEmpty, isNil } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth";
import { StageType } from "@/common";
import { logger } from "@/logging";
import { convertToJsonObject, prisma, recordChange } from "@/prisma";
import { Schedules } from "@prisma/client";

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
    return prisma.schedules
      .findFirst({
        where: { id: parseInt(id) },
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
      })
      .then((schedule) => {
        if (!schedule) {
          return res.status(404).json("Schedule not found.");
        }
        return res.status(200).json(schedule);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "PUT") {
    if (!user.roles.admin) {
      return res.status(401).json(null);
    }
    const schedule = req.body as Partial<Schedules>;
    if (!isEmpty(Object.keys(schedule))) {
      schedule.stage = StageType.UpdateType.enum;
    }
    return prisma.schedules
      .update({
        data: schedule,
        where: { id: parseInt(id) },
      })
      .then((response) => {
        recordChange("Update", "Schedules", response.id.toString(), user, convertToJsonObject(response));
        return res.status(200).json(response);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "DELETE") {
    if (!user.roles.admin) {
      return res.status(401).json(null);
    }
    return prisma.schedules
      .delete({
        where: { id: parseInt(id) },
      })
      .then((response) => {
        recordChange("Delete", "Schedules", response.id.toString(), user);
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
