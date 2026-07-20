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
const object_service_3 = require("./change/object.service");
const object_service_4 = require("./comment/object.service");
const object_service_5 = require("./configuration/object.service");
const object_service_6 = require("./control/object.service");
const object_service_7 = require("./feedback/object.service");
const object_service_8 = require("./file/object.service");
const object_service_9 = require("./geography/object.service");
const object_service_10 = require("./holiday/object.service");
const object_service_11 = require("./location/object.service");
const object_service_12 = require("./log/object.service");
const object_service_13 = require("./occupancy/object.service");
const object_service_14 = require("./schedule/object.service");
const object_service_15 = require("./setpoint/object.service");
const object_service_16 = require("./unit/object.service");
const object_service_17 = require("./user/object.service");
const object_service_18 = require("./historian/object.service");
const object_service_19 = require("./backup/object.service");
const query_service_1 = require("./account/query.service");
const query_service_2 = require("./banner/query.service");
const query_service_3 = require("./change/query.service");
const query_service_4 = require("./comment/query.service");
const query_service_5 = require("./config/query.service");
const query_service_6 = require("./configuration/query.service");
const query_service_7 = require("./control/query.service");
const query_service_8 = require("./current/query.service");
const query_service_9 = require("./feedback/query.service");
const query_service_10 = require("./file/query.service");
const query_service_11 = require("./geography/query.service");
const query_service_12 = require("./holiday/query.service");
const query_service_13 = require("./location/query.service");
const query_service_14 = require("./log/query.service");
const query_service_15 = require("./occupancy/query.service");
const query_service_16 = require("./schedule/query.service");
const query_service_17 = require("./setpoint/query.service");
const query_service_18 = require("./unit/query.service");
const query_service_19 = require("./user/query.service");
const query_service_20 = require("./historian/query.service");
const query_service_21 = require("./backup/query.service");
const mutate_service_1 = require("./account/mutate.service");
const mutate_service_2 = require("./banner/mutate.service");
const mutate_service_3 = require("./change/mutate.service");
const mutate_service_4 = require("./comment/mutate.service");
const mutate_service_5 = require("./configuration/mutate.service");
const mutate_service_6 = require("./control/mutate.service");
const mutate_service_7 = require("./current/mutate.service");
const mutate_service_8 = require("./feedback/mutate.service");
const mutate_service_9 = require("./file/mutate.service");
const mutate_service_10 = require("./holiday/mutate.service");
const mutate_service_11 = require("./location/mutate.service");
const mutate_service_12 = require("./log/mutate.service");
const mutate_service_13 = require("./occupancy/mutate.service");
const mutate_service_14 = require("./schedule/mutate.service");
const mutate_service_15 = require("./setpoint/mutate.service");
const mutate_service_16 = require("./unit/mutate.service");
const mutate_service_17 = require("./user/mutate.service");
const change_module_1 = require("../change/change.module");
const historian_module_1 = require("../historian/historian.module");
const mutate_service_18 = require("./backup/mutate.service");
const backup_discovery_service_1 = require("../services/backup/backup-discovery.service");
const backup_publisher_service_1 = require("../services/backup/backup-publisher.service");
const backup_archive_service_1 = require("../services/backup/backup-archive.service");
const keycloak_admin_service_1 = require("./keycloak/keycloak-admin.service");
const object_service_20 = require("./keycloak/object.service");
const query_service_22 = require("./keycloak/query.service");
const mutate_service_19 = require("./keycloak/mutate.service");
let SchemaModule = SchemaModule_1 = class SchemaModule {
    static register() {
        return {
            module: SchemaModule_1,
            imports: [core_1.DiscoveryModule, prisma_module_1.PrismaModule, subscription_module_1.SubscriptionModule, change_module_1.ChangeModule, historian_module_1.HistorianModule],
            providers: [
                builder_service_1.SchemaBuilderService,
                backup_discovery_service_1.BackupDiscoveryService,
                backup_publisher_service_1.BackupSubscriptionPublisher,
                backup_archive_service_1.BackupArchiveService,
                keycloak_admin_service_1.KeycloakAdminService,
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
        imports: [prisma_module_1.PrismaModule, subscription_module_1.SubscriptionModule, change_module_1.ChangeModule, historian_module_1.HistorianModule],
        exports: [builder_service_1.SchemaBuilderService],
        providers: [
            builder_service_1.SchemaBuilderService,
            backup_discovery_service_1.BackupDiscoveryService,
            backup_publisher_service_1.BackupSubscriptionPublisher,
            backup_archive_service_1.BackupArchiveService,
            object_service_1.AccountObject,
            object_service_2.BannerObject,
            object_service_3.ChangeObject,
            object_service_4.CommentObject,
            object_service_5.ConfigurationObject,
            object_service_6.ControlObject,
            object_service_7.FeedbackObject,
            object_service_8.FileObject,
            object_service_10.HolidayObject,
            object_service_11.LocationObject,
            object_service_12.LogObject,
            object_service_13.OccupancyObject,
            object_service_14.ScheduleObject,
            object_service_15.SetpointObject,
            object_service_17.UserObject,
            object_service_9.GeographyObject,
            object_service_3.ChangeObject,
            object_service_16.UnitObject,
            object_service_18.HistorianObject,
            object_service_19.BackupObject,
            object_service_20.KeycloakObject,
            query_service_1.AccountQuery,
            query_service_2.BannerQuery,
            query_service_3.ChangeQuery,
            query_service_4.CommentQuery,
            query_service_5.ConfigQuery,
            query_service_6.ConfigurationQuery,
            query_service_7.ControlQuery,
            query_service_8.CurrentQuery,
            query_service_9.FeedbackQuery,
            query_service_10.FileQuery,
            query_service_12.HolidayQuery,
            query_service_13.LocationQuery,
            query_service_14.LogQuery,
            query_service_15.OccupancyQuery,
            query_service_16.ScheduleQuery,
            query_service_17.SetpointQuery,
            query_service_19.UserQuery,
            query_service_11.GeographyQuery,
            query_service_3.ChangeQuery,
            query_service_18.UnitQuery,
            query_service_20.HistorianQuery,
            query_service_21.BackupQuery,
            query_service_22.KeycloakQuery,
            mutate_service_1.AccountMutation,
            mutate_service_2.BannerMutation,
            mutate_service_3.ChangeMutation,
            mutate_service_4.CommentMutation,
            mutate_service_5.ConfigurationMutation,
            mutate_service_6.ControlMutation,
            mutate_service_7.CurrentMutation,
            mutate_service_8.FeedbackMutation,
            mutate_service_9.FileMutation,
            mutate_service_10.HolidayMutation,
            mutate_service_11.LocationMutation,
            mutate_service_12.LogMutation,
            mutate_service_13.OccupancyMutation,
            mutate_service_14.ScheduleMutation,
            mutate_service_15.SetpointMutation,
            mutate_service_17.UserMutation,
            mutate_service_3.ChangeMutation,
            mutate_service_16.UnitMutation,
            mutate_service_18.BackupMutation,
            mutate_service_19.KeycloakMutation,
            keycloak_admin_service_1.KeycloakAdminService,
        ],
    })
], SchemaModule);
//# sourceMappingURL=schema.module.js.map