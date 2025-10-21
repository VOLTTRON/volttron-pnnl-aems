import { Prisma } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class OccupancyObject {
  readonly OccupancyObject;
  readonly OccupancyFields;

  constructor(builder: SchemaBuilderService) {
    this.OccupancyObject = builder.prismaObject("Occupancy", {
      authScopes: { user: true },
      subscribe(subscriptions, parent, _context, _info) {
        subscriptions.register(`Occupancy/${parent.id}`);
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
        label: t.exposeString("label"),
        date: t.expose("date", { type: builder.DateTime }),
        // foreign keys
        scheduleId: t.exposeString("scheduleId", { nullable: true }),
        configurationId: t.exposeString("configurationId", { nullable: true }),
        // direct relations
        schedule: t.relation("schedule", { nullable: true }),
        configuration: t.relation("configuration", { nullable: true }),
      }),
    });

    this.OccupancyFields = builder.enumType("OccupancyFields", {
      values: Object.values(Prisma.OccupancyScalarFieldEnum),
    });
  }
}
