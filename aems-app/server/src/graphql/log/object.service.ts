import { Prisma, LogType } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class LogObject {
  readonly LogType;
  readonly LogObject;
  readonly LogFields;

  constructor(builder: SchemaBuilderService) {
    this.LogType = builder.enumType("LogType", {
      values: Object.values(LogType),
    });

    this.LogObject = builder.prismaObject("Log", {
      authScopes: { admin: true },
      subscribe: (subscriptions, log, _context, _info) => {
        subscriptions.register(`Log/${log.id}`);
      },

      fields: (t) => ({
        // key
        id: t.exposeString("id"),
        // fields
        type: t.expose("type", { type: this.LogType, nullable: true }),
        message: t.exposeString("message", { nullable: true }),
        // metadata
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
      }),
    });

    this.LogFields = builder.enumType("LogFields", {
      values: Object.values(Prisma.LogScalarFieldEnum),
    });
  }
}
