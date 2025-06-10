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
    return res.status(400).end("ID must be specified.");
  } else if (req.method === "GET") {
    return prisma.configurations
      .findUniqueOrThrow({
        where: { id: parseInt(id) },
        include: {
          setpoint: true,
          mondaySchedule: true,
          tuesdaySchedule: true,
          wednesdaySchedule: true,
          thursdaySchedule: true,
          fridaySchedule: true,
          saturdaySchedule: true,
          sundaySchedule: true,
          holidaySchedule: true,
          holidays: { orderBy: [{ createdAt: "desc" }] },
          occupancies: { include: { schedule: true }, orderBy: [{ date: "desc" }] },
          _count: { select: { units: true, occupancies: true } },
        },
      })
      .then((configuration) => {
        return res.status(200).json(configuration);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "PUT") {
    if (!user.roles.admin) {
      return res.status(401).json(null);
    }
    const transform = (v: any) => {
      if (isObject(v)) {
        return Object.entries(v).reduce((p, [k, v]): any => {
          if (isString(k) && k !== "id") {
            if (
              [
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
              set(p, `${k}.update`, transform(v));
            } else if (["holidays", "occupancies"].includes(k) && isArray(v)) {
              set(
                p,
                `${k}.update`,
                v.filter((a) => a).map((a) => ({ data: a, where: { id: a.id } }))
              );
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
    const configuration = transform(req.body);
    if (!isEmpty(Object.keys(configuration))) {
      configuration.stage = StageType.UpdateType.enum;
    }
    return prisma.configurations
      .update({
        data: configuration,
        where: { id: parseInt(id) },
        include: {
          setpoint: true,
          mondaySchedule: true,
          tuesdaySchedule: true,
          wednesdaySchedule: true,
          thursdaySchedule: true,
          fridaySchedule: true,
          saturdaySchedule: true,
          sundaySchedule: true,
          holidaySchedule: true,
          holidays: { orderBy: [{ day: "asc" }, { month: "asc" }] },
          occupancies: {
            include: { schedule: true },
            orderBy: [{ date: "desc" }],
          },
        },
      })
      .then((response) => {
        recordChange("Update", "Configurations", response.id.toString(), user, convertToJsonObject(response));
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
    return prisma.configurations
      .delete({
        where: { id: parseInt(id) },
      })
      .then((response) => {
        recordChange("Delete", "Configurations", response.id.toString(), user);
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
