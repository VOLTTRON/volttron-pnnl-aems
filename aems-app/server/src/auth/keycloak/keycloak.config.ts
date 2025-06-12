import { parseBoolean } from "@local/common";
import { registerAs } from "@nestjs/config";
import { Provider } from ".";

export const config = registerAs(Provider, () => ({
  keycloak: {
    authUrl: process.env.KEYCLOAK_AUTH_URL ?? "",
    tokenUrl: process.env.KEYCLOAK_TOKEN_URL ?? "",
    userinfoUrl: process.env.KEYCLOAK_USERINFO_URL ?? "",
    logoutUrl: process.env.KEYCLOAK_LOGOUT_URL ?? "",
    clientId: process.env.KEYCLOAK_CLIENT_ID ?? "",
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? "",
    redirectUrl: process.env.KEYCLOAK_REDIRECT_URL ?? "",
    passRoles: parseBoolean(process.env.KEYCLOAK_PASS_ROLES),
    defaultRole: process.env.KEYCLOAK_DEFAULT_ROLE ?? "",
  },
}));
