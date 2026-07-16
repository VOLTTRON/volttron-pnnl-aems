import { DynamicModule, Module, ModuleMetadata } from "@nestjs/common";
import { SchemaBuilderService } from "./builder.service";
import { PrismaModule } from "@/prisma/prisma.module";
import { DiscoveryModule, DiscoveryService } from "@nestjs/core";
import { SubscriptionModule } from "@/subscription/subscription.module";
import { PothosMutationKey, PothosObjectKey, PothosQueryKey } from "./pothos.decorator";
// graphql objects
import { AccountObject } from "./account/object.service";
import { BannerObject } from "./banner/object.service";
import { ChangeObject } from "./change/object.service";
import { CommentObject } from "./comment/object.service";
import { ConfigurationObject } from "./configuration/object.service";
import { ControlObject } from "./control/object.service";
import { FeedbackObject } from "./feedback/object.service";
import { FileObject } from "./file/object.service";
import { GeographyObject } from "./geography/object.service";
import { HolidayObject } from "./holiday/object.service";
import { LocationObject } from "./location/object.service";
import { LogObject } from "./log/object.service";
import { OccupancyObject } from "./occupancy/object.service";
import { ScheduleObject } from "./schedule/object.service";
import { SetpointObject } from "./setpoint/object.service";
import { UnitObject } from "./unit/object.service";
import { UserObject } from "./user/object.service";
import { HistorianObject } from "./historian/object.service";
// graphql queries
import { BackupObject } from "./backup/object.service";
import { AccountQuery } from "./account/query.service";
import { BannerQuery } from "./banner/query.service";
import { ChangeQuery } from "./change/query.service";
import { CommentQuery } from "./comment/query.service";
import { ConfigQuery } from "./config/query.service";
import { ConfigurationQuery } from "./configuration/query.service";
import { ControlQuery } from "./control/query.service";
import { CurrentQuery } from "./current/query.service";
import { FeedbackQuery } from "./feedback/query.service";
import { FileQuery } from "./file/query.service";
import { GeographyQuery } from "./geography/query.service";
import { HolidayQuery } from "./holiday/query.service";
import { LocationQuery } from "./location/query.service";
import { LogQuery } from "./log/query.service";
import { OccupancyQuery } from "./occupancy/query.service";
import { ScheduleQuery } from "./schedule/query.service";
import { SetpointQuery } from "./setpoint/query.service";
import { UnitQuery } from "./unit/query.service";
import { UserQuery } from "./user/query.service";
import { HistorianQuery } from "./historian/query.service";
// graphql mutations
import { BackupQuery } from "./backup/query.service";
import { AccountMutation } from "./account/mutate.service";
import { BannerMutation } from "./banner/mutate.service";
import { ChangeMutation } from "./change/mutate.service";
import { CommentMutation } from "./comment/mutate.service";
import { ConfigurationMutation } from "./configuration/mutate.service";
import { ControlMutation } from "./control/mutate.service";
import { CurrentMutation } from "./current/mutate.service";
import { FeedbackMutation } from "./feedback/mutate.service";
import { FileMutation } from "./file/mutate.service";
import { HolidayMutation } from "./holiday/mutate.service";
import { LocationMutation } from "./location/mutate.service";
import { LogMutation } from "./log/mutate.service";
import { OccupancyMutation } from "./occupancy/mutate.service";
import { ScheduleMutation } from "./schedule/mutate.service";
import { SetpointMutation } from "./setpoint/mutate.service";
import { UnitMutation } from "./unit/mutate.service";
import { UserMutation } from "./user/mutate.service";
import { ChangeModule } from "@/change/change.module";
import { HistorianModule } from "@/historian/historian.module";
import { BackupMutation } from "./backup/mutate.service";
import { BackupDiscoveryService } from "@/services/backup/backup-discovery.service";
import { BackupSubscriptionPublisher } from "@/services/backup/backup-publisher.service";
import { BackupArchiveService } from "@/services/backup/backup-archive.service";
import { KeycloakAdminService } from "./keycloak/keycloak-admin.service";
import { KeycloakObject } from "./keycloak/object.service";
import { KeycloakQuery } from "./keycloak/query.service";
import { KeycloakMutation } from "./keycloak/mutate.service";

@Module({
  imports: [PrismaModule, SubscriptionModule, ChangeModule, HistorianModule],
  exports: [SchemaBuilderService],
  providers: [
    SchemaBuilderService,
    BackupDiscoveryService,
    BackupSubscriptionPublisher,
    BackupArchiveService,
    AccountObject,
    BannerObject,
    ChangeObject,
    CommentObject,
    ConfigurationObject,
    ControlObject,
    FeedbackObject,
    FileObject,
    HolidayObject,
    LocationObject,
    LogObject,
    OccupancyObject,
    ScheduleObject,
    SetpointObject,
    UserObject,
    GeographyObject,
    ChangeObject,
    UnitObject,
    HistorianObject,
    BackupObject,
    KeycloakObject,
    AccountQuery,
    BannerQuery,
    ChangeQuery,
    CommentQuery,
    ConfigQuery,
    ConfigurationQuery,
    ControlQuery,
    CurrentQuery,
    FeedbackQuery,
    FileQuery,
    HolidayQuery,
    LocationQuery,
    LogQuery,
    OccupancyQuery,
    ScheduleQuery,
    SetpointQuery,
    UserQuery,
    GeographyQuery,
    ChangeQuery,
    UnitQuery,
    HistorianQuery,
    BackupQuery,
    KeycloakQuery,
    AccountMutation,
    BannerMutation,
    ChangeMutation,
    CommentMutation,
    ConfigurationMutation,
    ControlMutation,
    CurrentMutation,
    FeedbackMutation,
    FileMutation,
    HolidayMutation,
    LocationMutation,
    LogMutation,
    OccupancyMutation,
    ScheduleMutation,
    SetpointMutation,
    UserMutation,
    ChangeMutation,
    UnitMutation,
    BackupMutation,
    KeycloakMutation,
    KeycloakAdminService,
  ],
})
export class SchemaModule implements ModuleMetadata {
  static register(): DynamicModule {
    return {
      module: SchemaModule,
      imports: [DiscoveryModule, PrismaModule, SubscriptionModule, ChangeModule, HistorianModule],
      providers: [
        SchemaBuilderService,
        BackupDiscoveryService,
        BackupSubscriptionPublisher,
        BackupArchiveService,
        KeycloakAdminService,
        {
          provide: `${PothosObjectKey.toString()}s`,
          inject: [DiscoveryService],
          useFactory: (discoveryService: DiscoveryService) =>
            discoveryService
              .getProviders()
              .filter((provider) => provider.metatype && Reflect.getMetadata(PothosObjectKey, provider.metatype)),
        },
        {
          provide: `${PothosQueryKey.toString()}s`,
          inject: [DiscoveryService],
          useFactory: (discoveryService: DiscoveryService) =>
            discoveryService
              .getProviders()
              .filter((provider) => provider.metatype && Reflect.getMetadata(PothosQueryKey, provider.metatype)),
        },
        {
          provide: `${PothosMutationKey.toString()}s`,
          inject: [DiscoveryService],
          useFactory: (discoveryService: DiscoveryService) =>
            discoveryService
              .getProviders()
              .filter((provider) => provider.metatype && Reflect.getMetadata(PothosMutationKey, provider.metatype)),
        },
      ],
      exports: [SchemaBuilderService],
    };
  }
}
