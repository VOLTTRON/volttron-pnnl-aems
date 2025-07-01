import { Prisma, ModelStage } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class ControlObject {
  readonly ControlObject;
  readonly ControlFields;
  readonly ModelStage;

  constructor(builder: SchemaBuilderService) {
    // Define the ModelStage enum
    this.ModelStage = builder.enumType("ModelStage", {
      values: Object.values(ModelStage),
    });

    this.ControlObject = builder.prismaObject("Control", {
      authScopes: { admin: true },
      subscribe(subscriptions, parent, _context, _info) {
        subscriptions.register(`Control/${parent.id}`);
      },
      fields: (t) => ({
        // key
        id: t.exposeString("id"),
        // metadata
        stage: t.expose("stage", { type: this.ModelStage }),
        message: t.exposeString("message", { nullable: true }),
        correlation: t.exposeString("correlation", { nullable: true }),
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
        // fields
        name: t.exposeString("name"),
        campus: t.exposeString("campus"),
        building: t.exposeString("building"),
        label: t.exposeString("label"),
        peakLoadExclude: t.exposeBoolean("peakLoadExclude"),
        // indirect relations
        units: t.relation("units"),
      }),
    });

    this.ControlFields = builder.enumType("ControlFields", {
      values: Object.values(Prisma.ControlScalarFieldEnum),
    });
  }
}
