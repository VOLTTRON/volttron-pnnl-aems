import { registerProvider } from "@/auth";
import { provider } from "./info";
import { prisma } from "@/prisma";
import { pick } from "lodash";

registerProvider({
  ...provider,
  authorize: async (values, { auth }) => {
    const authorized = auth.id && auth.roles.admin && auth.roles.super;
    const user = await prisma.user.findUnique({ where: { id: values?.id ?? "" } });
    if (user && authorized) {
      return {
        user: pick(user, ["id", "name", "email", "role"]),
      };
    } else {
      return { error: "Invalid user or insufficient permissions" };
    }
  },
});
