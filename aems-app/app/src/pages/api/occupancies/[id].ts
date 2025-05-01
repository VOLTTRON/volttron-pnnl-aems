"use server";

import { isArray, isEmpty, isNil, isObject, isString, set } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth";
import { StageType } from "@/common";
import { logger } from "@/logging";
import { convertToJsonObject, prisma, recordChange } from "@/prisma";

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
    return prisma.occupancies
      .findFirst({
        where: { id: parseInt(id) },
        include: {
          schedule: true,
        },
      })
      .then((occupancy) => {
        if (!occupancy) {
          return res.status(404).json("Occupancy not found.");
        }
        return res.status(200).json(occupancy);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "PUT") {
    const transform = (v: any) => {
      if (isObject(v)) {
        return Object.entries(v).reduce((p, [k, v]): any => {
          if (isString(k) && k !== "id") {
            if (["schedule"].includes(k)) {
              set(p, `${k}.update`, transform(v));
            } else {
              set(p, k, transform(v));
            }
          }
          return p;
        }, {} as any);
      } else {
        return v;
      }
    };
    const occupancy = transform(req.body);
    if (!isEmpty(Object.keys(occupancy))) {
      occupancy.stage = StageType.UpdateType.enum;
    }
    prisma.occupancies
      .update({
        data: occupancy,
        where: { id: parseInt(id) },
        include: {
          schedule: true,
        },
      })
      .then((response) => {
        recordChange("Update", "Occupancies", response.id.toString(), user, convertToJsonObject(response));
        return res.status(200).json(response);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "DELETE") {
    prisma.occupancies
      .delete({
        where: { id: parseInt(id) },
      })
      .then((response) => {
        recordChange("Delete", "Occupancies", response.id.toString(), user);
        return res.status(200).json(null);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else {
    res.status(404).json(null);
  }
}
