import { Prisma } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class GeographyObject {
  readonly GeographyObject;
  readonly GeographyFields;

  constructor(builder: SchemaBuilderService) {
    this.GeographyObject = builder.prismaObject("Geography", {
      authScopes: { user: true },
      subscribe: (subscriptions, geography, _context, _info) => {
        subscriptions.register(`Geography/${geography.id}`);
      },
      fields: (t) => ({
        // key
        id: t.exposeString("id", { nullable: true }),
        // fields
        name: t.exposeString("name", { nullable: true }),
        group: t.exposeString("group", { nullable: true }),
        type: t.exposeString("type", { nullable: true }),
        geojson: t.expose("geojson", { type: builder.GeographyGeoJson }),
        // metadata
        createdAt: t.expose("createdAt", { type: builder.DateTime, nullable: true }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime, nullable: true }),
      }),
    });

    this.GeographyFields = builder.enumType("GeographyFields", {
      values: Object.values(Prisma.GeographyScalarFieldEnum),
    });
  }
}
