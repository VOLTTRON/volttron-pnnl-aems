"use server";

import { merge } from "lodash";
import moment from "moment";
import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth/server";
import { LogType } from "@/common";
import prisma from "@/prisma";
import { Log } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authUser(req);
  if (req.method === "POST") {
    if (!user.roles.admin) {
      return res.status(401).json(null);
    }
    const log = req.body as Partial<Log> & { duration?: number };
    const { type, message, duration } = log;
    const temp = LogType.parse(type || "")?.enum || LogType.InfoType.enum;
    const isBanner = temp === LogType.BannerType.label;
    return prisma.log
      .create({
        data: {
          type: temp,
          message: `${isBanner ? "" : "[web-ui]: "}${message || ""}`,
          expiration: isBanner
            ? moment()
                .add(duration ?? 7, duration !== undefined ? "milliseconds" : "days")
                .format()
            : null,
        },
      })
      .then((created) => {
        return res.status(201).json(created);
      })
      .catch((error) => {
        return res.status(400).json(error.message);
      });
  } else if (req.method === "GET" && user.roles.admin) {
    return prisma.$queryRaw`
        WITH cte AS (
            SELECT
                SUM(
                    CASE
                        WHEN t1."message" = t2."message" THEN 0
                        ELSE 1
                    END
                ) OVER (
                    ORDER BY
                        t1."id"
                ) AS "sequence",
                t1."type",
                t1."message",
                t1."createdAt",
                t1."updatedAt"
            FROM
                public."Log" t1
                JOIN public."Log" t2 on t2."id" = t1."id" - 1
            WHERE
                t1."expiration" > NOW()
                OR t1."expiration" IS NULL
        )
        SELECT
            "sequence",
            COUNT(*) as "count",
            "type",
            "message",
            MIN("createdAt") as "createdAt",
            MAX("updatedAt") as "updatedAt"
        FROM
            cte
        GROUP BY
            "sequence",
            "type",
            "message"
        ORDER BY
            CASE
                WHEN "type" = 'Banner' THEN 0
                ELSE 1
            END ASC,
            "sequence" DESC
        LIMIT ${parseInt(process.env.LOG_MESSAGE_COUNT || "100")}
    `
      .then((messages) => {
        return res
          .status(200)
          .json((messages as any[]).map((m) => merge(m, { sequence: parseInt(m.sequence), count: parseInt(m.count) })));
      })
      .catch((error) => {
        return res.status(400).json(error.message);
      });
  } else if (req.method === "GET") {
    return prisma.log
      .findMany({
        where: {
          type: "Banner",
          expiration: { gt: new Date() },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: parseInt(process.env.LOG_MESSAGE_COUNT || "100"),
      })
      .then((messages) => {
        return res.status(200).json(messages);
      })
      .catch((error) => {
        return res.status(400).json(error.message);
      });
  } else {
    return res.status(404).json(null);
  }
}
