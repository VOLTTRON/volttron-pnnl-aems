import { registerProviderInfo } from "@/auth";

export const provider = {
  name: "bearer",
  label: "Bearer",
  credentials: {},
};

registerProviderInfo(provider);
