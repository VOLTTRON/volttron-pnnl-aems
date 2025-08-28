import { Prisma } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class LocationObject {
  readonly LocationObject;
  readonly LocationFields;

  constructor(builder: SchemaBuilderService) {
    this.LocationObject = builder.prismaObject("Location", {
      authScopes: { user: true },
      subscribe(subscriptions, parent, _context, _info) {
        subscriptions.register(`Location/${parent.id}`);
      },
      fields: (t) => ({
        // key
        id: t.exposeID("id"),
        // metadata
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
        // fields
        name: t.exposeString("name"),
        latitude: t.exposeFloat("latitude"),
        longitude: t.exposeFloat("longitude"),
        // indirect relations
        units: t.relation("units"),
      }),
    });

    this.LocationFields = builder.enumType("LocationFields", {
      values: Object.values(Prisma.LocationScalarFieldEnum),
    });
  }
}
