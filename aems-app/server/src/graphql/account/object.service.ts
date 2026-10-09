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
      // Accounts are admin-only — reads of this type are gated at the type level.
      authScopes: { admin: true },
      subscribe: (subscriptions, account, _context, _info) => {
        subscriptions.register(`Account/${account.id}`);
      },
      fields: (t) => ({
        // key
        id: t.exposeString("id"),
        // fields (no token fields: an account's tokens are not exposed by any GraphQL field)
        type: t.exposeString("type"),
        provider: t.exposeString("provider"),
        providerAccountId: t.exposeString("providerAccountId"),
        expires_at: t.exposeInt("expires_at", { nullable: true }),
        scope: t.exposeString("scope"),
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
