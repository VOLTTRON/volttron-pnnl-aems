"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const common_1 = require("@local/common");
const config_1 = require("@nestjs/config");
const _1 = require(".");
exports.config = (0, config_1.registerAs)(_1.Provider, () => ({
    keycloak: {
        authUrl: process.env.KEYCLOAK_AUTH_URL ?? "",
        tokenUrl: process.env.KEYCLOAK_TOKEN_URL ?? "",
        userinfoUrl: process.env.KEYCLOAK_USERINFO_URL ?? "",
        logoutUrl: process.env.KEYCLOAK_LOGOUT_URL ?? "",
        clientId: process.env.KEYCLOAK_CLIENT_ID ?? "",
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? "",
        redirectUrl: process.env.KEYCLOAK_REDIRECT_URL ?? "",
        passRoles: (0, common_1.parseBoolean)(process.env.KEYCLOAK_PASS_ROLES),
        defaultRole: process.env.KEYCLOAK_DEFAULT_ROLE ?? "",
    },
}));
//# sourceMappingURL=keycloak.config.js.map