"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareModule = void 0;
const common_1 = require("@nestjs/common");
const authjs_middleware_1 = require("../auth/authjs/authjs.middleware");
const authjs_controller_1 = require("../auth/authjs/authjs.controller");
const ext_middleware_1 = require("../ext/ext.middleware");
const auth_module_1 = require("../auth/auth.module");
const prisma_module_1 = require("../prisma/prisma.module");
const subscription_module_1 = require("../subscription/subscription.module");
const grafana_module_1 = require("../grafana/grafana.module");
const grafana_middleware_1 = require("../grafana/grafana.middleware");
let MiddlewareModule = class MiddlewareModule {
    configure(consumer) {
        consumer.apply(authjs_middleware_1.AuthjsMiddleware).forRoutes("*");
        consumer.apply(authjs_controller_1.AuthjsController).forRoutes("authjs");
        consumer.apply(ext_middleware_1.ExtRewriteMiddleware).forRoutes({ path: "ext/*path", method: common_1.RequestMethod.ALL });
        consumer.apply(grafana_middleware_1.GrafanaRewriteMiddleware).forRoutes({ path: "gdb/*path", method: common_1.RequestMethod.ALL });
    }
};
exports.MiddlewareModule = MiddlewareModule;
exports.MiddlewareModule = MiddlewareModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, prisma_module_1.PrismaModule, subscription_module_1.SubscriptionModule, grafana_module_1.GrafanaModule],
        providers: [authjs_middleware_1.AuthjsMiddleware, authjs_controller_1.AuthjsController, ext_middleware_1.ExtRewriteMiddleware, grafana_middleware_1.GrafanaRewriteMiddleware],
        exports: [authjs_middleware_1.AuthjsMiddleware, authjs_controller_1.AuthjsController, ext_middleware_1.ExtRewriteMiddleware, grafana_middleware_1.GrafanaRewriteMiddleware],
    })
], MiddlewareModule);
//# sourceMappingURL=middleware.module.js.map