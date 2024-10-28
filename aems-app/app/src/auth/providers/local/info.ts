import { registerProviderInfo } from "@/auth";

export const provider = {
  name: "local",
  label: "Local",
  credentials: {
    email: { label: "Email", name: "email", type: "text" as const, placeholder: "email" },
    password: { label: "Password", name: "current-password", type: "password" as const },
  },
};

registerProviderInfo(provider);
