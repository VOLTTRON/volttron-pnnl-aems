"use server";
 
import { NextApiRequest, NextApiResponse } from "next";
 
import { authUser } from "@/auth/server";
import { logger } from "@/logging";
import prisma from "@/prisma";
import { Units } from "@prisma/client";
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await authUser(req);
  if (!user.roles.user) {
    return res.status(401).json(null);
  }
  if (req.method === "POST") {
    const unit = req.body as Partial<Units>;
    return prisma.units
      .create({
        data: {
          name: unit.name || "",
          label: unit.label || "",
        },
      })
      .then((unit) => {
        return res.status(201).json(unit);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "GET") {
    return prisma.units
      .findMany({
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
              holidays: { orderBy: [{ createdAt: "desc" }] },
              occupancies: {
                include: { schedule: true },
                orderBy: [{ date: "desc" }],
              },
            },
          },
          location: true,
        },
        orderBy: [{ campus: "asc" }, { building: "asc" }, { name: "asc" }],
      })
      .then((units) => {
        return res.status(200).json(units);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else {
    return res.status(404).json(null);
  }
}
