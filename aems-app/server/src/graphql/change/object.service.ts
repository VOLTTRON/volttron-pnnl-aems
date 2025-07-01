import { Prisma, ChangeMutation } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class ChangeObject {
  readonly ChangeObject;
  readonly ChangeFields;
  readonly ChangeMutation;

  constructor(builder: SchemaBuilderService) {
    // Define the ChangeMutation enum
    this.ChangeMutation = builder.enumType("ChangeMutation", {
      values: Object.values(ChangeMutation),
    });

    this.ChangeObject = builder.prismaObject("Change", {
      authScopes: { admin: true },
      subscribe(subscriptions, parent, _context, _info) {
        subscriptions.register(`Change/${parent.id}`);
      },
      fields: (t) => ({
        // key
        id: t.exposeString("id"),
        // metadata
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
        // fields
        table: t.exposeString("table"),
        key: t.exposeString("key"),
        mutation: t.expose("mutation", { type: this.ChangeMutation }),
        data: t.expose("data", {
          type: builder.ChangeData,
          nullable: true,
        }),
        // foreign keys
        userId: t.exposeString("userId", { nullable: true }),
        // direct relations
        user: t.relation("user", { nullable: true }),
      }),
    });

    this.ChangeFields = builder.enumType("ChangeFields", {
      values: Object.values(Prisma.ChangeScalarFieldEnum),
    });
  }
}
