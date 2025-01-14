"use server";

import { concat, merge } from "lodash";
import moment from "moment";
import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth";
import { LogType } from "@/common";
import { prisma } from "@/prisma";
import { Log } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authUser(req);
  if (req.method === "POST") {
    if (!user.roles.admin) {
      return res.status(401).json(null);
    }
    const log = req.body as Partial<Log> & { duration?: number };
    const { type, message, duration } = log;
    const isBanner = /Banner/i.test(type ?? "");
    if (isBanner) {
      return prisma.banner
        .create({
          data: {
            message: message || "",
            expiration: moment()
              .add(duration ?? 7, duration !== undefined ? "milliseconds" : "days")
              .format(),
          },
        })
        .then((created) => {
          return res.status(201).json(created);
        })
        .catch((error) => {
          return res.status(400).json(error.message);
        });
    }
    const logType = LogType.parse(type || "")?.enum || LogType.InfoType.enum;
    return prisma.log
      .create({
        data: {
          type: logType,
          message: `${isBanner ? "" : "[web-ui]: "}${message || ""}`,
        },
      })
      .then((created) => {
        return res.status(201).json(created);
      })
      .catch((error) => {
        return res.status(400).json(error.message);
      });
  } else if (req.method === "GET" && user.roles.admin) {
    const banners = await prisma.banner.findMany({ where: { expiration: { gt: new Date() } } });
    const messages = await prisma.log.findMany({ take: parseInt(process.env.LOG_MESSAGE_COUNT || "100") });
    return res.status(200).json(
      concat(
        banners.map((b) => merge(b, { type: "Banner" })),
        messages.map((m) => merge(m, { type: m.type?.toString(), expiration: null }))
      ).map((m, i) => merge(m, { sequence: i, count: 1 }))
    );
  } else if (req.method === "GET") {
    return prisma.banner
      .findMany({
        where: {
          expiration: { gt: new Date() },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: parseInt(process.env.LOG_MESSAGE_COUNT || "100"),
      })
      .then((messages) => {
        return res.status(200).json(messages.map((m) => merge(m, { type: "Banner" })));
      })
      .catch((error) => {
        return res.status(400).json(error.message);
      });
  } else {
    return res.status(404).json(null);
  }
}
