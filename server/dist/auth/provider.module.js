"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ProviderModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderModule = void 0;
const common_1 = require("@nestjs/common");
const bearer_module_1 = require("./bearer/bearer.module");
const local_module_1 = require("./local/local.module");
const keycloak_module_1 = require("./keycloak/keycloak.module");
const core_1 = require("@nestjs/core");
const auth_module_1 = require("./auth.module");
const super_module_1 = require("./super/super.module");
let ProviderModule = ProviderModule_1 = class ProviderModule {
    static register(options) {
        return {
            module: ProviderModule_1,
            imports: [
                ...(options?.path
                    ? [auth_module_1.AuthModule, core_1.RouterModule.register([{ path: options.path, module: auth_module_1.AuthModule }])]
                    : [auth_module_1.AuthModule]),
                ...[bearer_module_1.BearerModule, keycloak_module_1.KeycloakModule, local_module_1.LocalModule, super_module_1.SuperModule]
                    .map((m) => options?.path
                    ? [m, core_1.RouterModule.register([{ path: options.path, children: [{ path: "auth", module: m }] }])]
                    : [m, core_1.RouterModule.register([{ path: "auth", module: m }])])
                    .flat(),
            ],
        };
    }
};
exports.ProviderModule = ProviderModule;
exports.ProviderModule = ProviderModule = ProviderModule_1 = __decorate([
    (0, common_1.Module)({})
], ProviderModule);
//# sourceMappingURL=provider.module.js.map