"use server";

import { isArray, isEmpty, isNil, isObject, isString, set } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth/server";
import { StageType } from "@/common";
import { logger } from "@/logging";
import prisma from "@/prisma";
import { Controls } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authUser(req);
  if (!user.roles.user) {
    return res.status(401).json(null);
  }
  const { id } = req.query;
  if (isArray(id) || isNil(id)) {
    return res.status(400).json("ID must be specified.");
  } else if (req.method === "DELETE") {
    if (!user.roles.admin) {
      return res.status(401).json(null);
    }
    return prisma.controls
      .delete({
        where: { id: parseInt(id) },
      })
      .then((control) => {
        if (!control) {
          return res.status(404).json("Control not found.");
        }
        return res.status(200).json(null);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "GET") {
    return prisma.controls
      .findFirst({
        where: { id: parseInt(id) },
        include: {
          units: true,
        },
      })
      .then((control) => {
        if (!control) {
          return res.status(404).json("Control not found.");
        }
        return res.status(200).json(control);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "PUT") {
    const transform = async (v: any) => {
      if (isObject(v)) {
        return await Object.entries(v).reduce(async (a, [k, v]) => {
          const p = await a;
          if (isString(k) && k !== "id") {
            if (
              [
                "configuration",
                "setpoint",
                "mondaySchedule",
                "tuesdaySchedule",
                "wednesdaySchedule",
                "thursdaySchedule",
                "fridaySchedule",
                "saturdaySchedule",
                "sundaySchedule",
                "holidaySchedule",
                "schedule",
              ].includes(k) &&
              isObject(v)
            ) {
              set(p, `${k}.update`, await transform(v));
            } else if (["units", "holidays", "occupancies"].includes(k) && isArray(v)) {
              set(
                p,
                `${k}.update`,
                v.filter((a) => a).map((a) => ({ data: a, where: { id: a.id } }))
              );
            } else if (["location"].includes(k) && isObject(v)) {
              const location = await prisma.locations.findFirst({ where: v, select: { id: true } });
              if (location) {
                set(p, `${k}.connect`, { id: location.id });
              } else {
                set(p, `${k}.create`, v);
              }
            } else {
              set(p, k, await transform(v));
            }
          }
          return p;
        }, Promise.resolve({} as any));
      } else {
        return v;
      }
    };
    const control = (await transform(req.body)) as Partial<Controls>;
    if (!isEmpty(Object.keys(control))) {
      control.stage = StageType.UpdateType.enum;
    }
    return prisma.controls
      .update({
        data: control,
        where: { id: parseInt(id) },
      })
      .then((control) => {
        if (!control) {
          return res.status(404).json("Control not found.");
        }
        return res.status(200).json(control);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else {
    return res.status(404).json(null);
  }
}
