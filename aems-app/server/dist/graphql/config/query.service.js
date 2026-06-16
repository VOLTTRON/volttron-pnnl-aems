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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigQuery = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
const app_config_1 = require("../../app.config");
let ConfigQuery = class ConfigQuery {
    constructor(builder, configService) {
        const ServerConfigRef = builder
            .objectRef("ServerConfig")
            .implement({
            fields: (t) => ({
                serviceOverride: t.exposeBoolean("serviceOverride"),
                holidaySchedule: t.exposeBoolean("holidaySchedule"),
            }),
        });
        builder.queryField("readConfig", (t) => t.field({
            description: "Read whitelisted server-side configuration flags.",
            type: ServerConfigRef,
            resolve: () => ({
                serviceOverride: configService.service.config.serviceOverride,
                holidaySchedule: configService.service.config.holidaySchedule,
            }),
        }));
    }
};
exports.ConfigQuery = ConfigQuery;
exports.ConfigQuery = ConfigQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __param(1, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        app_config_1.AppConfigService])
], ConfigQuery);
//# sourceMappingURL=query.service.js.map