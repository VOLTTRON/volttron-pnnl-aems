"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildConfig = void 0;
const prisma_adapter_1 = require("@auth/prisma-adapter");
const common_1 = require("@local/common");
const constants_1 = require("@local/common/dist/constants");
const node_crypto_1 = require("node:crypto");
const common_2 = require("@nestjs/common");
const validateStore = (store) => {
    switch (store.toLocaleLowerCase()) {
        case "jwt":
            return "jwt";
        case "database":
            return "database";
        default:
            throw new Error(`Invalid Authjs session store '${store}'.`);
    }
};
const buildConfig = (configService, prismaService, authService, subscriptionService) => {
    const logger = new common_2.Logger("AuthjsConfig");
    return {
        adapter: (0, prisma_adapter_1.PrismaAdapter)(prismaService.prisma),
        basePath: "/authjs",
        callbacks: {
            redirect({ url }) {
                return configService.nodeEnv !== "production" ? (configService.cors.origin ?? url) : url;
            },
            jwt({ token, account, profile: _profile }) {
                if (account?.provider === "keycloak" && account.access_token) {
                    try {
                        const payload = JSON.parse(Buffer.from(account.access_token.split(".")[1], "base64").toString());
                        const rolesFromToken = payload?.realm_access?.roles || [];
                        const roles = rolesFromToken
                            .map((v) => common_1.RoleType.parse(v)?.enum)
                            .filter((0, common_1.typeofEnum)(constants_1.RoleEnum));
                        token.keycloakRoles = roles;
                        logger.debug(`Extracted roles from Keycloak token: ${roles.join(", ")}`);
                    }
                    catch (error) {
                        logger.warn("Failed to decode Keycloak access token for role extraction", error);
                    }
                }
                return token;
            },
            async signIn({ user, account, profile: _profile }) {
                if (account?.provider === "keycloak" && user.email) {
                    try {
                        const tokenWithRoles = account;
                        const roles = tokenWithRoles.keycloakRoles || [];
                        const existingUser = await prismaService.prisma.user.findFirst({
                            where: {
                                OR: [
                                    { email: user.email },
                                    { accounts: { some: { provider: "keycloak", providerAccountId: account.providerAccountId } } },
                                ],
                            },
                            include: { accounts: { where: { provider: "keycloak" } } },
                        });
                        if (existingUser) {
                            if (configService.keycloak.passRoles) {
                                const updatedUser = await prismaService.prisma.user.update({
                                    where: { id: existingUser.id },
                                    data: {
                                        name: user.name || existingUser.name,
                                        email: user.email,
                                        emailVerified: ("emailVerified" in user ? user.emailVerified : null) || existingUser.emailVerified,
                                        role: roles.join(" ") || "",
                                    },
                                });
                                await subscriptionService.publish("User", {
                                    topic: "User",
                                    id: updatedUser.id,
                                    mutation: common_1.Mutation.Updated,
                                });
                                await subscriptionService.publish(`User/${updatedUser.id}`, {
                                    topic: "User",
                                    id: updatedUser.id,
                                    mutation: common_1.Mutation.Updated,
                                });
                                logger.debug(`Updated existing user roles: ${roles.join(", ")}`);
                            }
                        }
                        else {
                            const roleToSet = configService.keycloak.passRoles
                                ? roles.join(" ") || ""
                                : (common_1.RoleType.parse(configService.keycloak.defaultRole ?? "")?.enum ?? "");
                            const newUser = await prismaService.prisma.user.create({
                                data: {
                                    name: user.name || "",
                                    email: user.email,
                                    emailVerified: "emailVerified" in user ? user.emailVerified : null,
                                    password: (0, node_crypto_1.randomUUID)(),
                                    role: roleToSet,
                                },
                            });
                            await subscriptionService.publish("User", {
                                topic: "User",
                                id: newUser.id,
                                mutation: common_1.Mutation.Created,
                            });
                            logger.debug(`Created new user with role: ${roleToSet}`);
                        }
                    }
                    catch (error) {
                        logger.error("Error managing user roles during AuthJS signIn", error);
                    }
                }
                return true;
            },
            async session({ session }) {
                if (session.user?.email) {
                    try {
                        const user = await prismaService.prisma.user.findUnique({
                            where: { email: session.user.email },
                            omit: { password: true },
                        });
                        if (user) {
                            session.user = {
                                ...session.user,
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                emailVerified: user.emailVerified,
                                ...(user.role && { role: user.role }),
                            };
                        }
                    }
                    catch (error) {
                        logger.warn("Failed to update session with user data", error);
                    }
                }
                return session;
            },
        },
        debug: configService.auth.debug || configService.nodeEnv !== "production",
        providers: authService
            .getProviderNames()
            .map((name) => authService.getProvider(name))
            .filter((provider) => (0, common_1.typeofObject)(provider, (p) => "create" in p))
            .map((provider) => provider.create()),
        redirectProxyUrl: configService.cors.origin,
        secret: configService.jwt.secret,
        session: {
            maxAge: configService.session.maxAge,
            strategy: validateStore(configService.session.store),
            updateAge: 0,
        },
        trustHost: true,
    };
};
exports.buildConfig = buildConfig;
//# sourceMappingURL=authjs.config.js.map