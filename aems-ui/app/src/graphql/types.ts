import { AuthUser } from "@/auth/types";
import { BaseContext } from "@apollo/server";
import { Holiday_type, Log_type, Stage_type } from "@prisma/client";

export interface Context extends BaseContext {
  authUser: AuthUser;
}

/* eslint-disable */
export type Scalars = {
  JSON: { Input: unknown; Output: unknown };
  DateTime: { Input: Date; Output: Date };
  LogType: { Input: Log_type; Output: Log_type };
  StageType: { Input: Stage_type; Output: Stage_type };
  HolidayType: { Input: Holiday_type; Output: Holiday_type };
};
/* eslint-enable */

export interface Aggregate<T extends string> {
  average?: T[] | null;
  count?: T[] | null;
  maximum?: T[] | null;
  minimum?: T[] | null;
  sum?: T[] | null;
}

export interface GroupBy<T extends string> {
  _avg?: { [k in T]: boolean | null };
  _count?: { [k in T]: boolean | null };
  _max?: { [k in T]: boolean | null };
  _min?: { [k in T]: boolean | null };
  _sum?: { [k in T]: boolean | null };
}
