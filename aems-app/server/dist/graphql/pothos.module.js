"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PothosGraphQLModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PothosGraphQLModule = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const pothos_driver_1 = require("./pothos.driver");
const core_1 = require("@nestjs/core");
const default_1 = require("@apollo/server/plugin/landingPage/default");
const disabled_1 = require("@apollo/server/plugin/disabled");
const lodash_1 = require("lodash");
const schema_module_1 = require("./schema.module");
const prisma_module_1 = require("../prisma/prisma.module");
const subscription_module_1 = require("../subscription/subscription.module");
const app_config_1 = require("../app.config");
const auth_module_1 = require("../auth/auth.module");
const logging_1 = require("../logging");
const websocket_service_1 = require("../auth/websocket.service");
const framework_module_1 = require("../auth/framework.module");
let PothosGraphQLModule = PothosGraphQLModule_1 = class PothosGraphQLModule {
    static forRoot() {
        const moduleOptionsFactory = (configService) => ({
            playground: false,
            sortSchema: true,
            autoSchemaFile: configService.nodeEnv !== "production" ? "../client/schema.graphql" : undefined,
            plugins: configService.graphql.editor
                ? [
                    (0, default_1.ApolloServerPluginLandingPageLocalDefault)({
                        embed: { endpointIsEditable: false, runTelemetry: false },
                    }),
                    (0, disabled_1.ApolloServerPluginUsageReportingDisabled)(),
                    (0, disabled_1.ApolloServerPluginSchemaReportingDisabled)(),
                ]
                : [],
            logger: new logging_1.InfoLogger(PothosGraphQLModule_1.name),
            path: "graphql",
            subscriptions: {
                "graphql-ws": {
                    path: "/graphql",
                },
                "subscriptions-transport-ws": {
                    path: "/graphql",
                },
            },
        });
        let PothosApolloDriverWrapper = class PothosApolloDriverWrapper extends pothos_driver_1.PothosApolloDriver {
            constructor(modulesContainer, configService) {
                super(modulesContainer);
                this.configService = configService;
            }
            registerServer(options) {
                const moduleOptions = moduleOptionsFactory(this.configService);
                return super.registerServer({
                    sortSchema: moduleOptions.sortSchema,
                    autoSchemaFile: moduleOptions.autoSchemaFile,
                    ...options,
                });
            }
        };
        PothosApolloDriverWrapper = __decorate([
            (0, common_1.Injectable)(),
            __param(1, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
            __metadata("design:paramtypes", [core_1.ModulesContainer,
                app_config_1.AppConfigService])
        ], PothosApolloDriverWrapper);
        return {
            module: PothosGraphQLModule_1,
            imports: [
                auth_module_1.AuthModule,
                framework_module_1.FrameworkModule.register(),
                prisma_module_1.PrismaModule,
                schema_module_1.SchemaModule.register(),
                subscription_module_1.SubscriptionModule,
                graphql_1.GraphQLModule.forRootAsync({
                    driver: PothosApolloDriverWrapper,
                    imports: [auth_module_1.AuthModule, framework_module_1.FrameworkModule.register()],
                    inject: [websocket_service_1.WebSocketAuthService, app_config_1.AppConfigService.Key],
                    useFactory: (wsAuthService, configService) => ({
                        context: ({ req, extra, }) => {
                            let user;
                            if (req?.user) {
                                user = req.user;
                            }
                            else if (extra?.socket?.user) {
                                user = extra?.socket?.user;
                            }
                            else if (extra?.request?.user) {
                                user = extra?.request?.user;
                            }
                            return {
                                user,
                            };
                        },
                        subscriptions: {
                            "graphql-ws": {
                                path: "/graphql",
                                onConnect: async (context) => {
                                    const { extra } = context;
                                    const request = extra?.request;
                                    if (request) {
                                        try {
                                            const user = await wsAuthService.authenticateWebSocket(request);
                                            if (extra?.socket) {
                                                extra.socket.user = user;
                                            }
                                            request.user = user;
                                            return true;
                                        }
                                        catch (error) {
                                            console.error("WebSocket authentication error in onConnect:", error);
                                            return true;
                                        }
                                    }
                                    return true;
                                },
                            },
                            "subscriptions-transport-ws": {
                                path: "/graphql",
                                onConnect: async (_connectionParams, _websocket, context) => {
                                    const request = context?.request;
                                    if (request) {
                                        try {
                                            const user = await wsAuthService.authenticateWebSocket(request);
                                            request.user = user;
                                            if (context?.socket) {
                                                context.socket.user = user;
                                            }
                                            return { user };
                                        }
                                        catch (error) {
                                            console.error("WebSocket authentication error in onConnect (legacy):", error);
                                            return {};
                                        }
                                    }
                                    return {};
                                },
                            },
                        },
                        ...(0, lodash_1.omit)(moduleOptionsFactory(configService), ["sortSchema", "autoSchemaFile", "subscriptions"]),
                    }),
                }),
            ],
        };
    }
};
exports.PothosGraphQLModule = PothosGraphQLModule;
exports.PothosGraphQLModule = PothosGraphQLModule = PothosGraphQLModule_1 = __decorate([
    (0, common_1.Module)({})
], PothosGraphQLModule);
//# sourceMappingURL=pothos.module.js.map