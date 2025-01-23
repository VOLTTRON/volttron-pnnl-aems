import { registerProviderInfo } from "@/auth";

export const provider = {
  name: "oneid",
  label: "OneID",
  credentials: {},
};

registerProviderInfo(provider);
