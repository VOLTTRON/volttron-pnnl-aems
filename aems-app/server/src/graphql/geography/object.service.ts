import { Prisma } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";
import { GraphQLScalarType } from "graphql";
import { Scalars } from "..";

@Injectable()
@PothosObject()
export class GeographyObject {
  readonly GeographyGeoJson;
  readonly GeographyObject;
  readonly GeographyFields;

  constructor(builder: SchemaBuilderService) {
    this.GeographyGeoJson = builder.addScalarType(
      "GeographyGeoJson",
      new GraphQLScalarType<Scalars["GeographyGeoJson"]["Input"], Scalars["GeographyGeoJson"]["Output"]>({
        name: "GeographyGeoJson",
      }),
    );

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
        geojson: t.expose("geojson", { type: this.GeographyGeoJson }),
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
