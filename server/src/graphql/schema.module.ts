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
import { AccountQuery } from "./account/query.service";
import { BannerQuery } from "./banner/query.service";
import { CommentQuery } from "./comment/query.service";
import { CurrentQuery } from "./current/query.service";
import { FeedbackQuery } from "./feedback/query.service";
import { FileQuery } from "./file/query.service";
import { LogQuery } from "./log/query.service";
import { UserQuery } from "./user/query.service";
import { GeographyQuery } from "./geography/query.service";
import { AccountMutation } from "./account/mutate.service";
import { BannerMutation } from "./banner/mutate.service";
import { CommentMutation } from "./comment/mutate.service";
import { CurrentMutation } from "./current/mutate.service";
import { FeedbackMutation } from "./feedback/mutate.service";
import { FileMutation } from "./file/mutate.service";
import { LogMutation } from "./log/mutate.service";
import { UserMutation } from "./user/mutate.service";

@Module({
  imports: [PrismaModule, SubscriptionModule],
  exports: [SchemaBuilderService],
  providers: [
    SchemaBuilderService,
    AccountObject,
    BannerObject,
    CommentObject,
    FeedbackObject,
    FileObject,
    LogObject,
    UserObject,
    GeographyObject,
    AccountQuery,
    BannerQuery,
    CommentQuery,
    CurrentQuery,
    FeedbackQuery,
    FileQuery,
    LogQuery,
    UserQuery,
    GeographyQuery,
    AccountMutation,
    BannerMutation,
    CommentMutation,
    CurrentMutation,
    FeedbackMutation,
    FileMutation,
    LogMutation,
    UserMutation,
  ],
})
export class SchemaModule implements ModuleMetadata {
  static register(): DynamicModule {
    return {
      module: SchemaModule,
      imports: [DiscoveryModule, PrismaModule, SubscriptionModule],
      providers: [
        SchemaBuilderService,
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
