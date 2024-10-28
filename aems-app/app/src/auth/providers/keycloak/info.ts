import { registerProviderInfo } from "@/auth";

export const provider = {
  name: "keycloak",
  label: "Keycloak",
  credentials: {},
};

registerProviderInfo(provider);
