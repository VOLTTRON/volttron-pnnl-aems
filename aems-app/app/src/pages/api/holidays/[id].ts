"use server";

import { isArray, isEmpty, isNil } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth";
import { StageType } from "@/common";
import { logger } from "@/logging";
import { convertToJsonObject, prisma, recordChange } from "@/prisma";
import { Holidays } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authUser(req);
  if (!user.roles.user) {
    return res.status(401).json(null);
  }
  const { id } = req.query;
  if (isArray(id) || isNil(id)) {
    return res.status(400).json("ID must be specified.");
  } else if (req.method === "GET") {
    return prisma.holidays
      .findFirst({
        where: { id: parseInt(id) },
        include: {
          _count: {
            select: {
              configurations: true,
            },
          },
        },
      })
      .then((holiday) => {
        if (!holiday) {
          return res.status(404).json("Holiday not found.");
        }
        return res.status(200).json(holiday);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "PUT") {
    if (!user.roles.admin) {
      return res.status(401).json(null);
    }
    const holiday = req.body as Partial<Holidays>;
    if (!isEmpty(Object.keys(holiday))) {
      holiday.stage = StageType.UpdateType.enum;
    }
    return prisma.holidays
      .update({
        data: holiday,
        where: { id: parseInt(id) },
      })
      .then((response) => {
        recordChange("Update", "Holidays", response.id.toString(), user, convertToJsonObject(response));
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
    return prisma.holidays
      .delete({
        where: { id: parseInt(id) },
      })
      .then((response) => {
        recordChange("Delete", "Holidays", response.id.toString(), user);
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
