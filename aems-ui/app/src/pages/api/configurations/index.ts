"use server";

import { isFinite } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth/server";
import { StageType } from "@/common";
import { logger } from "@/logging";
import prisma from "@/prisma";
import { Holidays, Occupancies, Schedules, Setpoints } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authUser(req);
  if (!user.roles.user) {
    return res.status(401).json(null);
  }
  if (req.method === "POST") {
    const unitId = req.body?.unitId as number;
    const label = (req.body?.label as string) || "";
    const setpoint = req.body?.setpoint as Setpoints;
    const mondaySchedule = req.body?.mondaySchedule as Schedules;
    const tuesdaySchedule = req.body?.tuesdaySchedule as Schedules;
    const wednesdaySchedule = req.body?.wednesdaySchedule as Schedules;
    const thursdaySchedule = req.body?.thursdaySchedule as Schedules;
    const fridaySchedule = req.body?.fridaySchedule as Schedules;
    const saturdaySchedule = req.body?.saturdaySchedule as Schedules;
    const sundaySchedule = req.body?.sundaySchedule as Schedules;
    const holidaySchedule = req.body?.holidaySchedule as Schedules;
    const holidays = req.body?.holidays as Holidays[];
    const occupancies = req.body?.occupancies as Occupancies[];
    return prisma.configurations
      .create({
        data: {
          label,
          ...(setpoint && { setpoint: { create: setpoint } }),
          ...(mondaySchedule && { mondaySchedule: { create: mondaySchedule } }),
          ...(tuesdaySchedule && { tuesdaySchedule: { create: tuesdaySchedule } }),
          ...(wednesdaySchedule && { wednesdaySchedule: { create: wednesdaySchedule } }),
          ...(thursdaySchedule && { thursdaySchedule: { create: thursdaySchedule } }),
          ...(fridaySchedule && { fridaySchedule: { create: fridaySchedule } }),
          ...(saturdaySchedule && { saturdaySchedule: { create: saturdaySchedule } }),
          ...(sundaySchedule && { sundaySchedule: { create: sundaySchedule } }),
          ...(holidaySchedule && { holidaySchedule: { create: holidaySchedule } }),
          ...(holidays && { holidays: { create: holidays } }),
          ...(occupancies && { occupancies: { create: occupancies } }),
          ...(isFinite(unitId) && {
            units: {
              connect: [{ id: unitId }],
            },
          }),
        },
      })
      .then((configuration) => {
        if (isFinite(unitId)) {
          prisma.units
            .update({ where: { id: unitId }, data: { stage: StageType.UpdateType.enum } })
            .then(() => {
              return res.status(201).json(configuration);
            })
            .catch((error) => {
              logger.warn(error);
              return res.status(400).json(error.message);
            });
        } else {
          return res.status(201).json(configuration);
        }
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "GET") {
    return prisma.configurations
      .findMany({
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
        orderBy: {
          createdAt: "desc",
        },
      })
      .then((configurations) => {
        return res.status(200).json(configurations);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else {
    return res.status(404).json(null);
  }
}