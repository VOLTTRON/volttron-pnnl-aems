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
exports.SchemaBuilderService = void 0;
const auth_1 = require("../auth");
const common_1 = require("@local/common");
const client_1 = require("@prisma/client");
const core_1 = require("@pothos/core");
const plugin_complexity_1 = require("@pothos/plugin-complexity");
const plugin_prisma_1 = require("@pothos/plugin-prisma");
const plugin_prisma_utils_1 = require("@pothos/plugin-prisma-utils");
const plugin_scope_auth_1 = require("@pothos/plugin-scope-auth");
const plugin_smart_subscriptions_1 = require("@pothos/plugin-smart-subscriptions");
const plugin_relay_1 = require("@pothos/plugin-relay");
const lodash_1 = require("lodash");
const common_2 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const promises_1 = require("node:timers/promises");
const graphql_1 = require("graphql");
const pothos_decorator_1 = require("./pothos.decorator");
const app_config_1 = require("../app.config");
const subscription_service_1 = require("../subscription/subscription.service");
let SchemaBuilderService = class SchemaBuilderService extends core_1.default {
    constructor(prismaService, configService, subscriptionService) {
        super({
            plugins: [plugin_relay_1.default, plugin_scope_auth_1.default, plugin_prisma_1.default, plugin_prisma_utils_1.default, plugin_smart_subscriptions_1.default, plugin_complexity_1.default],
            relay: {},
            scopeAuth: {
                authorizeOnSubscribe: true,
                treatErrorsAsUnauthorized: true,
                authScopes: (context) => context.user?.authRoles ?? new auth_1.AuthUser().roles,
            },
            prisma: {
                client: prismaService.prisma,
                exposeDescriptions: true,
                filterConnectionTotalCount: true,
                onUnusedQuery: configService.nodeEnv === "production" ? null : "warn",
            },
            smartSubscriptions: {
                ...(0, plugin_smart_subscriptions_1.subscribeOptionsFromIterator)((topic) => {
                    return subscriptionService.asyncIterator(topic);
                }),
            },
            complexity: {
                defaultComplexity: 1,
                defaultListMultiplier: 10,
                limit: {
                    complexity: 500,
                    depth: 5,
                },
            },
        });
        this.initialized = false;
        this.LogType = this.enumType("LogType", { values: common_1.LogType.values.map((v) => v.enum) });
        this.FeedbackStatus = this.enumType("FeedbackStatus", { values: common_1.FeedbackStatus.values.map((v) => v.enum) });
        this.Mode = this.enumType("ModeType", { values: Object.values(common_1.Mode) });
        this.Mutation = this.enumType("MutationType", { values: Object.values(common_1.Mutation) });
        this.enumType("ModelStage", { values: Object.values(client_1.ModelStage) });
        this.enumType("HolidayType", { values: Object.values(client_1.HolidayType) });
        this.DateTime = this.addScalarType("DateTime", new graphql_1.GraphQLScalarType({
            name: "DateTime",
        }));
        this.Json = this.addScalarType("Json", new graphql_1.GraphQLScalarType({
            name: "Json",
        }));
        this.UserPreferences = this.addScalarType("UserPreferences", new graphql_1.GraphQLScalarType({
            name: "UserPreferences",
        }));
        this.SessionData = this.addScalarType("SessionData", new graphql_1.GraphQLScalarType({ name: "SessionData" }));
        this.EventPayload = this.addScalarType("EventPayload", new graphql_1.GraphQLScalarType({
            name: "EventPayload",
        }));
        this.GeographyGeoJson = this.addScalarType("GeographyGeoJson", new graphql_1.GraphQLScalarType({
            name: "GeographyGeoJson",
        }));
        this.ChangeData = this.addScalarType("ChangeData", new graphql_1.GraphQLScalarType({
            name: "ChangeData",
        }));
        this.addScalarType("AccountGroupBy", new graphql_1.GraphQLScalarType({
            name: "AccountGroupBy",
        }));
        this.addScalarType("BannerGroupBy", new graphql_1.GraphQLScalarType({
            name: "BannerGroupBy",
        }));
        this.addScalarType("CommentGroupBy", new graphql_1.GraphQLScalarType({
            name: "CommentGroupBy",
        }));
        this.addScalarType("FeedbackGroupBy", new graphql_1.GraphQLScalarType({
            name: "FeedbackGroupBy",
        }));
        this.addScalarType("FileGroupBy", new graphql_1.GraphQLScalarType({
            name: "FileGroupBy",
        }));
        this.addScalarType("GeographyGroupBy", new graphql_1.GraphQLScalarType({
            name: "GeographyGroupBy",
        }));
        this.addScalarType("LogGroupBy", new graphql_1.GraphQLScalarType({
            name: "LogGroupBy",
        }));
        this.addScalarType("UserGroupBy", new graphql_1.GraphQLScalarType({
            name: "UserGroupBy",
        }));
        this.addScalarType("ChangeGroupBy", new graphql_1.GraphQLScalarType({
            name: "ChangeGroupBy",
        }));
        this.addScalarType("LocationGroupBy", new graphql_1.GraphQLScalarType({
            name: "LocationGroupBy",
        }));
        this.addScalarType("SetpointGroupBy", new graphql_1.GraphQLScalarType({
            name: "SetpointGroupBy",
        }));
        this.addScalarType("ControlGroupBy", new graphql_1.GraphQLScalarType({
            name: "ControlGroupBy",
        }));
        this.addScalarType("HolidayGroupBy", new graphql_1.GraphQLScalarType({
            name: "HolidayGroupBy",
        }));
        this.addScalarType("ScheduleGroupBy", new graphql_1.GraphQLScalarType({
            name: "ScheduleGroupBy",
        }));
        this.addScalarType("ConfigurationGroupBy", new graphql_1.GraphQLScalarType({
            name: "ConfigurationGroupBy",
        }));
        this.addScalarType("UnitGroupBy", new graphql_1.GraphQLScalarType({
            name: "UnitGroupBy",
        }));
        this.addScalarType("OccupancyGroupBy", new graphql_1.GraphQLScalarType({
            name: "OccupancyGroupBy",
        }));
        this.queryType({});
        this.mutationType({});
        this.subscriptionType({});
        this.BooleanFilter = this.prismaFilter("Boolean", {
            ops: ["equals", "not"],
        });
        this.IntFilter = this.prismaFilter("Int", {
            ops: ["equals", "gt", "gte", "lt", "lte", "not", "in"],
        });
        this.FloatFilter = this.prismaFilter("Float", {
            ops: ["equals", "gt", "gte", "lt", "lte", "not", "in"],
        });
        this.StringFilter = this.prismaFilter("String", {
            ops: ["contains", "equals", "startsWith", "endsWith", "not", "in", "mode"],
        });
        this.DateTimeFilter = this.prismaFilter("DateTime", {
            ops: ["contains", "equals", "gt", "gte", "lt", "lte", "not", "in", "mode"],
        });
        this.LogTypeFilter = this.prismaFilter("LogType", {
            ops: ["equals", "not", "in", "mode"],
        });
        this.FeedbackStatusFilter = this.prismaFilter("FeedbackStatus", {
            ops: ["equals", "not", "in", "mode"],
        });
        this.PagingInput = this.inputType("PagingInput", {
            fields: (t) => ({
                skip: t.int({ required: true }),
                take: t.int({ required: true }),
            }),
        });
    }
    onModuleInit() {
        this.initialized = true;
    }
    awaitSchema() {
        if (this.initialized) {
            return super.toSchema();
        }
        else {
            const controller = new AbortController();
            const { signal } = controller;
            setTimeout(() => controller.abort(), 60000);
            return new Promise((resolve) => {
                (0, promises_1.setInterval)(100, () => {
                    if (this.initialized) {
                        resolve(super.toSchema());
                        controller.abort();
                    }
                }, { signal });
            });
        }
    }
    static aggregateToGroupBy(aggregate) {
        const temp = {};
        [
            { src: "average", dst: "_avg" },
            { src: "count", dst: "_count" },
            { src: "maximum", dst: "_max" },
            { src: "minimum", dst: "_min" },
            { src: "sum", dst: "_sum" },
        ].forEach(({ src, dst }) => {
            const fields = aggregate?.[src];
            if (fields) {
                temp[dst] = fields.reduce((a, v) => (0, lodash_1.set)(a, v, true), {});
            }
        });
        return temp;
    }
};
exports.SchemaBuilderService = SchemaBuilderService;
exports.SchemaBuilderService = SchemaBuilderService = __decorate([
    (0, common_2.Injectable)(),
    (0, pothos_decorator_1.PothosBuilder)(),
    __param(1, (0, common_2.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_1.AppConfigService,
        subscription_service_1.SubscriptionService])
], SchemaBuilderService);
//# sourceMappingURL=builder.service.js.map