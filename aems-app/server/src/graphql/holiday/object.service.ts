import { Prisma, HolidayType } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class HolidayObject {
  readonly HolidayObject;
  readonly HolidayFields;
  readonly HolidayType;

  constructor(builder: SchemaBuilderService) {
    // Define the HolidayType enum
    this.HolidayType = builder.enumType("HolidayType", {
      values: Object.values(HolidayType),
    });

    this.HolidayObject = builder.prismaObject("Holiday", {
      authScopes: { user: true },
      subscribe(subscriptions, parent, _context, _info) {
        subscriptions.register(`Holiday/${parent.id}`);
      },
      fields: (t) => ({
        // key
        id: t.exposeString("id"),
        // metadata
        stage: t.expose("stage", { type: builder.ModelStage }),
        message: t.exposeString("message", { nullable: true }),
        correlation: t.exposeString("correlation", { nullable: true }),
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
        // fields
        type: t.expose("type", { type: this.HolidayType }),
        label: t.exposeString("label"),
        month: t.exposeInt("month", { nullable: true }),
        day: t.exposeInt("day", { nullable: true }),
        observance: t.exposeString("observance", { nullable: true }),
        // indirect relations
        configurations: t.relation("configurations"),
      }),
    });

    this.HolidayFields = builder.enumType("HolidayFields", {
      values: Object.values(Prisma.HolidayScalarFieldEnum),
    });
  }
}
