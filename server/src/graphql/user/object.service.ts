import { Prisma } from "@prisma/client";
import { omit } from "lodash";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class UserObject {
  readonly UserObject;
  readonly UserFields;

  constructor(builder: SchemaBuilderService) {
    this.UserObject = builder.prismaObject("User", {
      authScopes: { user: true },
      subscribe(subscriptions, parent, _context, _info) {
        subscriptions.register(`User/${parent.id}`);
      },
      fields: (t) => ({
        // key
        id: t.exposeString("id"),
        // fields
        name: t.exposeString("name", { nullable: true }),
        email: t.exposeString("email"),
        image: t.exposeString("image", { nullable: true }),
        emailVerified: t.expose("emailVerified", { type: builder.DateTime, nullable: true }),
        role: t.exposeString("role", { nullable: true }),
        // password field is intentionally omitted
        preferences: t.expose("preferences", { type: builder.UserPreferences, nullable: true }),
        // metadata
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
        // indirect relations
        comments: t.relation("comments", { nullable: true }),
        accounts: t.relation("accounts", { nullable: true }),
        banners: t.relation("banners", { nullable: true }),
      }),
    });

    this.UserFields = builder.enumType("UserFields", {
      values: Object.values(omit(Prisma.UserScalarFieldEnum, "password")),
    });
  }
}
