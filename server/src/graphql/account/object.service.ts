import { Prisma } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class AccountObject {
  readonly AccountObject;
  readonly AccountFields;

  constructor(builder: SchemaBuilderService) {
    this.AccountObject = builder.prismaObject("Account", {
      authScopes: { user: true },
      subscribe: (subscriptions, account, _context, _info) => {
        subscriptions.register(`Account/${account.id}`);
      },
      fields: (t) => ({
        // key
        id: t.exposeString("id"),
        // fields
        type: t.exposeString("type"),
        provider: t.exposeString("provider"),
        providerAccountId: t.exposeString("providerAccountId"),
        // token and session
        refresh_token: t.exposeString("refresh_token"),
        access_token: t.exposeString("access_token"),
        token_type: t.exposeString("token_type"),
        expires_at: t.exposeInt("expires_at", { nullable: true }),
        scope: t.exposeString("scope"),
        id_token: t.exposeString("id_token", { nullable: true }),
        session_state: t.exposeString("session_state"),
        // metadata
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
        // foreign keys
        userId: t.exposeString("userId", { nullable: true }),
        // direct relations
        user: t.relation("user", { nullable: true }),
      }),
    });

    this.AccountFields = builder.enumType("AccountFields", {
      values: Object.values(Prisma.AccountScalarFieldEnum),
    });
  }
}
