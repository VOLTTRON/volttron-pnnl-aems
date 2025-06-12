"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SchemaModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaModule = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("./builder.service");
const prisma_module_1 = require("../prisma/prisma.module");
const core_1 = require("@nestjs/core");
const subscription_module_1 = require("../subscription/subscription.module");
const pothos_decorator_1 = require("./pothos.decorator");
const object_service_1 = require("./account/object.service");
const object_service_2 = require("./banner/object.service");
const object_service_3 = require("./comment/object.service");
const object_service_4 = require("./feedback/object.service");
const object_service_5 = require("./file/object.service");
const object_service_6 = require("./log/object.service");
const object_service_7 = require("./user/object.service");
const object_service_8 = require("./geography/object.service");
const query_service_1 = require("./account/query.service");
const query_service_2 = require("./banner/query.service");
const query_service_3 = require("./comment/query.service");
const query_service_4 = require("./current/query.service");
const query_service_5 = require("./feedback/query.service");
const query_service_6 = require("./file/query.service");
const query_service_7 = require("./log/query.service");
const query_service_8 = require("./user/query.service");
const query_service_9 = require("./geography/query.service");
const mutate_service_1 = require("./account/mutate.service");
const mutate_service_2 = require("./banner/mutate.service");
const mutate_service_3 = require("./comment/mutate.service");
const mutate_service_4 = require("./current/mutate.service");
const mutate_service_5 = require("./feedback/mutate.service");
const mutate_service_6 = require("./file/mutate.service");
const mutate_service_7 = require("./log/mutate.service");
const mutate_service_8 = require("./user/mutate.service");
let SchemaModule = SchemaModule_1 = class SchemaModule {
    static register() {
        return {
            module: SchemaModule_1,
            imports: [core_1.DiscoveryModule, prisma_module_1.PrismaModule, subscription_module_1.SubscriptionModule],
            providers: [
                builder_service_1.SchemaBuilderService,
                {
                    provide: `${pothos_decorator_1.PothosObjectKey.toString()}s`,
                    inject: [core_1.DiscoveryService],
                    useFactory: (discoveryService) => discoveryService
                        .getProviders()
                        .filter((provider) => provider.metatype && Reflect.getMetadata(pothos_decorator_1.PothosObjectKey, provider.metatype)),
                },
                {
                    provide: `${pothos_decorator_1.PothosQueryKey.toString()}s`,
                    inject: [core_1.DiscoveryService],
                    useFactory: (discoveryService) => discoveryService
                        .getProviders()
                        .filter((provider) => provider.metatype && Reflect.getMetadata(pothos_decorator_1.PothosQueryKey, provider.metatype)),
                },
                {
                    provide: `${pothos_decorator_1.PothosMutationKey.toString()}s`,
                    inject: [core_1.DiscoveryService],
                    useFactory: (discoveryService) => discoveryService
                        .getProviders()
                        .filter((provider) => provider.metatype && Reflect.getMetadata(pothos_decorator_1.PothosMutationKey, provider.metatype)),
                },
            ],
            exports: [builder_service_1.SchemaBuilderService],
        };
    }
};
exports.SchemaModule = SchemaModule;
exports.SchemaModule = SchemaModule = SchemaModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, subscription_module_1.SubscriptionModule],
        exports: [builder_service_1.SchemaBuilderService],
        providers: [
            builder_service_1.SchemaBuilderService,
            object_service_1.AccountObject,
            object_service_2.BannerObject,
            object_service_3.CommentObject,
            object_service_4.FeedbackObject,
            object_service_5.FileObject,
            object_service_6.LogObject,
            object_service_7.UserObject,
            object_service_8.GeographyObject,
            query_service_1.AccountQuery,
            query_service_2.BannerQuery,
            query_service_3.CommentQuery,
            query_service_4.CurrentQuery,
            query_service_5.FeedbackQuery,
            query_service_6.FileQuery,
            query_service_7.LogQuery,
            query_service_8.UserQuery,
            query_service_9.GeographyQuery,
            mutate_service_1.AccountMutation,
            mutate_service_2.BannerMutation,
            mutate_service_3.CommentMutation,
            mutate_service_4.CurrentMutation,
            mutate_service_5.FeedbackMutation,
            mutate_service_6.FileMutation,
            mutate_service_7.LogMutation,
            mutate_service_8.UserMutation,
        ],
    })
], SchemaModule);
//# sourceMappingURL=schema.module.js.map