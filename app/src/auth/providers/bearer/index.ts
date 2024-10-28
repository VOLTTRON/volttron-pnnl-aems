import { registerProvider } from "@/auth";
import { provider } from "./info";

registerProvider({
  ...provider,
  authorize: async (_values) => {
    return {};
  },
});
