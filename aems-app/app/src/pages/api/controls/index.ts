"use server";

import { merge } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth";
import { logger } from "@/logging";
import { prisma } from "@/prisma";
import { Controls } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authUser(req);
  if (!user.roles.user) {
    return res.status(401).json(null);
  }
  if (req.method === "POST") {
    if (!user.roles.admin) {
      return res.status(401).json(null);
    }
    const control = req.body as Partial<Controls>;
    return prisma.controls
      .create({
        data: merge(
          {
            label: "",
            name: "",
          },
          control
        ),
      })
      .then((control) => {
        return res.status(201).json(control);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else if (req.method === "GET") {
    return prisma.controls
      .findMany({
        include: {
          units: { orderBy: { label: "asc" } },
        },
        orderBy: {
          label: "asc",
        },
      })
      .then((controls) => {
        return res.status(200).json(controls);
      })
      .catch((error) => {
        logger.warn(error);
        return res.status(400).json(error.message);
      });
  } else {
    return res.status(404).json(null);
  }
}
