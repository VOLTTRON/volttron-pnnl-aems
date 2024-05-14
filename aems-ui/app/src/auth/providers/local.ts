import bcrypt from "@node-rs/bcrypt";
import { pick } from "lodash";

import prisma from "@/prisma";

import { registerProvider as registerProviderInfo } from "../";
import { registerProvider } from "../server";

const provider = {
  name: "local",
  label: "Local",
  credentials: {
    name: { label: "Name", type: "text" as const, placeholder: "name" },
    email: { label: "Email", type: "text" as const, placeholder: "email" },
    password: { label: "Password", type: "password" as const },
  },
};

registerProviderInfo(provider);

registerProvider({
  ...provider,
  authorize: async (values) => {
    "use server";
    // always look up a user and hash passwords to prevent brute force algorithms from determining valid emails by response speed
    const user = await prisma.user.findFirst({ where: { OR: [{ email: values?.email }, { name: values?.name }] } });
    const authorized = await bcrypt.compare(values?.password ?? "", user?.password ?? "");
    if (values?.password && user && authorized) {
      return { user: pick(user, ["id", "name", "email", "role"]), redirect: "/" };
    } else {
      return {};
    }
  },
});
