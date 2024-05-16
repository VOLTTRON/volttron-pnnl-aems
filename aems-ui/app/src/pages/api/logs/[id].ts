"use server";

import { isArray, isNil } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";

import { authUser } from "@/auth/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await authUser(req);
  if (!user.roles.user) {
    return res.status(401).json(null);
  }
  const { id } = req.query;
  if (isArray(id) || isNil(id)) {
    return res.status(400).json("ID must be specified.");
  } else {
    if (!user.roles.admin) {
      return res.status(401).json(null);
    }
    return res.status(404).json(null);
  }
}
