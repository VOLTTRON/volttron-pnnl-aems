import { registerProvider as registerProviderInfo } from "../";
import { registerProvider } from "../server";

const provider = {
  name: "bearer",
  label: "Bearer",
  credentials: {},
};

registerProviderInfo(provider);

registerProvider({
  ...provider,
  authorize: async (_values) => {
    "use server";
    return { redirect: "/" };
  },
});
