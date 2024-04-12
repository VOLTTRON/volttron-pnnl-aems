import { authUser } from "@/auth/server";
import graphql from "@/graphql";
import { startServerAndCreateNextHandler } from "@as-integrations/next";

const handleRequest = startServerAndCreateNextHandler(graphql, {
  context: async () => ({
    authUser: await authUser(),
  }),
});

export { handleRequest as GET, handleRequest as POST, handleRequest as OPTIONS };
