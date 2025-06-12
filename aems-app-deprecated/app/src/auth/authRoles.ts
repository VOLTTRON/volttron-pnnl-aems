import { RoleType } from "@/common";
import { AuthRoles } from "./types";
import { parseBoolean } from "@/utils/util";

const authenticate = parseBoolean(process.env.AUTHENTICATE);

const authRoles = (role: string) => {
  const roles = role.split(/[, |]+/);
  return RoleType.values.reduce((a, v) => {
    a[v.enum] = authenticate ? v.granted(...roles) ?? false : true;
    return a;
  }, {} as AuthRoles);
};

export default authRoles;
