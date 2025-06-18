"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const ext_middleware_1 = require("./ext/ext.middleware");
const api_module_1 = require("./api/api.module");
const core_1 = require("@nestjs/core");
const pothos_module_1 = require("./graphql/pothos.module");
const prisma_module_1 = require("./prisma/prisma.module");
const services_module_1 = require("./services/services.module");
const provider_module_1 = require("./auth/provider.module");
const app_config_1 = require("./app.config");
const logging_module_1 = require("./logging/logging.module");
const auth_module_1 = require("./auth/auth.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(ext_middleware_1.ExtRewriteMiddleware).forRoutes({ path: "ext/*path", method: common_1.RequestMethod.ALL });
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                expandVariables: true,
                load: [app_config_1.AppConfigToken],
                envFilePath: [".env", ".env.local"],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    name: "short",
                    ttl: 1000,
                    limit: 3,
                },
                {
                    name: "medium",
                    ttl: 10000,
                    limit: 20,
                },
                {
                    name: "long",
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            prisma_module_1.PrismaModule,
            logging_module_1.LoggingModule,
            api_module_1.ApiModule,
            core_1.RouterModule.register([{ path: "api", module: api_module_1.ApiModule }]),
            provider_module_1.ProviderModule.register({ path: "api" }),
            pothos_module_1.PothosGraphQLModule.forRoot(),
            services_module_1.ServicesModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map