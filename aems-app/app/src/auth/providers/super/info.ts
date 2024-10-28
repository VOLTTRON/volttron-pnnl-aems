import { registerProviderInfo } from "@/auth";

export const provider = {
  name: "super",
  label: "Super",
  credentials: {
    id: { label: "ID", type: "text" as const, required: true },
  },
};

registerProviderInfo(provider);
