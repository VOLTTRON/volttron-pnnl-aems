import { DynamicModule, Module, ModuleMetadata } from "@nestjs/common";
import { SchemaBuilderService } from "./builder.service";
import { PrismaModule } from "@/prisma/prisma.module";
import { DiscoveryModule, DiscoveryService } from "@nestjs/core";
import { SubscriptionModule } from "@/subscription/subscription.module";
import { PothosMutationKey, PothosObjectKey, PothosQueryKey } from "./pothos.decorator";
import { AccountObject } from "./account/object.service";
import { BannerObject } from "./banner/object.service";
import { CommentObject } from "./comment/object.service";
import { FeedbackObject } from "./feedback/object.service";
import { FileObject } from "./file/object.service";
import { LogObject } from "./log/object.service";
import { UserObject } from "./user/object.service";
import { GeographyObject } from "./geography/object.service";
import { BackupObject } from "./backup/object.service";
import { AccountQuery } from "./account/query.service";
import { BannerQuery } from "./banner/query.service";
import { CommentQuery } from "./comment/query.service";
import { CurrentQuery } from "./current/query.service";
import { FeedbackQuery } from "./feedback/query.service";
import { FileQuery } from "./file/query.service";
import { LogQuery } from "./log/query.service";
import { UserQuery } from "./user/query.service";
import { GeographyQuery } from "./geography/query.service";
import { BackupQuery } from "./backup/query.service";
import { AccountMutation } from "./account/mutate.service";
import { BannerMutation } from "./banner/mutate.service";
import { CommentMutation } from "./comment/mutate.service";
import { CurrentMutation } from "./current/mutate.service";
import { FeedbackMutation } from "./feedback/mutate.service";
import { FileMutation } from "./file/mutate.service";
import { LogMutation } from "./log/mutate.service";
import { UserMutation } from "./user/mutate.service";
import { BackupMutation } from "./backup/mutate.service";
import { BackupDiscoveryService } from "@/services/backup/backup-discovery.service";
import { BackupSubscriptionPublisher } from "@/services/backup/backup-publisher.service";
import { BackupArchiveService } from "@/services/backup/backup-archive.service";
import { KeycloakAdminService } from "./keycloak/keycloak-admin.service";
import { KeycloakObject } from "./keycloak/object.service";
import { KeycloakQuery } from "./keycloak/query.service";
import { KeycloakMutation } from "./keycloak/mutate.service";

@Module({
  imports: [PrismaModule, SubscriptionModule],
  exports: [SchemaBuilderService],
  providers: [
    SchemaBuilderService,
    BackupDiscoveryService,
    BackupSubscriptionPublisher,
    BackupArchiveService,
    AccountObject,
    BannerObject,
    CommentObject,
    FeedbackObject,
    FileObject,
    LogObject,
    UserObject,
    GeographyObject,
    BackupObject,
    KeycloakObject,
    AccountQuery,
    BannerQuery,
    CommentQuery,
    CurrentQuery,
    FeedbackQuery,
    FileQuery,
    LogQuery,
    UserQuery,
    GeographyQuery,
    BackupQuery,
    KeycloakQuery,
    AccountMutation,
    BannerMutation,
    CommentMutation,
    CurrentMutation,
    FeedbackMutation,
    FileMutation,
    LogMutation,
    UserMutation,
    BackupMutation,
    KeycloakMutation,
    KeycloakAdminService,
  ],
})
export class SchemaModule implements ModuleMetadata {
  static register(): DynamicModule {
    return {
      module: SchemaModule,
      imports: [DiscoveryModule, PrismaModule, SubscriptionModule],
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
