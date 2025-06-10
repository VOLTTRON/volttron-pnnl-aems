"use server";

import { isArray, isEmpty, isNil, isObject, isString, pick, set } from "lodash";
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
  if (req.method === "DELETE") {
    if (!user.roles.admin) {
      return res.status(401).json(null);
    }
    return prisma.units
      .delete({
        where: {
          id: parseInt(id),
        },
      })
      .then((response) => {
        recordChange("Delete", "Units", response.id.toString(), user);
        return res.status(200).json(null);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "GET") {
    return prisma.units
      .findFirst({
        where: {
          id: parseInt(id),
          ...(!user.roles.admin && { users: { some: { id: user.id } } }),
        },
        include: {
          configuration: {
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
              holidays: { orderBy: [{ id: "desc" }] },
              occupancies: {
                include: { schedule: true },
                orderBy: [{ date: "desc" }, { id: "desc" }],
              },
            },
          },
          location: true,
        },
      })
      .then((unit) => {
        if (!unit) {
          return res.status(404).json("Unit not found.");
        }
        return res.status(200).json(unit);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "PUT") {
    const transform = async (v: any) => {
      if (isObject(v)) {
        const entries = Object.entries(v);
        return await entries.reduce(async (a, [k, v]) => {
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
            } else if (["holidays", "occupancies"].includes(k) && isArray(v)) {
              set(
                p,
                `${k}.update`,
                v.filter((a) => a).map((a) => ({ data: a, where: { id: a.id } }))
              );
            } else if (["location"].includes(k) && isObject(v)) {
              const location = await prisma.locations.findFirst({
                where: v,
                select: { id: true },
              });
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
    let unit = await transform(req.body);
    if (!user.roles.admin) {
      unit = pick(unit, [
        "label",
        "configuration.update.setpoint",
        "configuration.update.occupancies",
        "configuration.create.occupancies",
        "configuration.delete.occupancies",
      ]);
    }
    if (!isEmpty(Object.keys(unit))) {
      unit.stage = StageType.UpdateType.enum;
    }
    return prisma.units
      .update({
        data: unit,
        where: {
          id: parseInt(id),
        },
        include: {
          configuration: {
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
              holidays: { orderBy: [{ id: "desc" }] },
              occupancies: {
                include: { schedule: true },
                orderBy: [{ date: "desc" }, { id: "desc" }],
              },
            },
          },
          location: true,
        },
      })
      .then((response) => {
        recordChange("Update", "Units", response.id.toString(), user, convertToJsonObject(response));
        return res.status(200).json(response);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else {
    return res.status(404).json(null);
  }
}
