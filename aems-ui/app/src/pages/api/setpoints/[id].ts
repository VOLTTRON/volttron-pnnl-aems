"use server";

import { isArray, isEmpty, isNil } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth/server";
import { StageType } from "@/common";
import { logger } from "@/logging";
import prisma from "@/prisma";
import { Setpoints } from "@prisma/client";

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
    return prisma.setpoints
      .findFirst({
        where: { id: parseInt(id) },
        include: {
          _count: {
            select: {
              configurations: true,
              schedules: true,
            },
          },
        },
      })
      .then((setpoint) => {
        if (!setpoint) {
          return res.status(404).json("Setpoint not found.");
        }
        return res.status(200).json(setpoint);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "PUT") {
    const setpoint = req.body as Partial<Setpoints>;
    if (!isEmpty(Object.keys(setpoint))) {
      setpoint.stage = StageType.UpdateType.enum;
    }
    return prisma.setpoints
      .update({
        data: setpoint,
        where: { id: parseInt(id) },
      })
      .then((setpoint) => {
        if (!setpoint) {
          return res.status(404).json("Setpoint not found.");
        }
        return res.status(200).json(setpoint);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "DELETE") {
    return prisma.setpoints
      .delete({
        where: { id: parseInt(id) },
      })
      .then((setpoint) => {
        if (!setpoint) {
          return res.status(404).json("Setpoint not found.");
        }
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
