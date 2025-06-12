import { Prisma } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class BannerObject {
  readonly BannerObject;
  readonly BannerFields;

  constructor(builder: SchemaBuilderService) {
    this.BannerObject = builder.prismaObject("Banner", {
      authScopes: { user: true },
      subscribe: (subscriptions, banner, _context, _info) => {
        subscriptions.register(`Banner/${banner.id}`);
      },
      fields: (t) => ({
        // key
        id: t.exposeString("id", {}),
        // fields
        message: t.exposeString("message", { nullable: true }),
        expiration: t.expose("expiration", { type: builder.DateTime, nullable: true }),
        // metadata
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
        // indirect relations
        users: t.relation("users", { authScopes: { admin: true }, nullable: true }),
      }),
    });

    this.BannerFields = builder.enumType("BannerFields", {
      values: Object.values(Prisma.BannerScalarFieldEnum),
    });
  }
}
