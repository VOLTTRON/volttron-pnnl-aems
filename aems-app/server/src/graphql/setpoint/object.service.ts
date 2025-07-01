import { Prisma, ModelStage } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class SetpointObject {
  readonly SetpointObject;
  readonly SetpointFields;
  readonly ModelStage;

  constructor(builder: SchemaBuilderService) {
    // Define the ModelStage enum
    this.ModelStage = builder.enumType("ModelStage", {
      values: Object.values(ModelStage),
    });

    this.SetpointObject = builder.prismaObject("Setpoint", {
      authScopes: { admin: true },
      subscribe(subscriptions, parent, _context, _info) {
        subscriptions.register(`Setpoint/${parent.id}`);
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
        label: t.exposeString("label"),
        setpoint: t.exposeFloat("setpoint"),
        deadband: t.exposeFloat("deadband"),
        heating: t.exposeFloat("heating"),
        cooling: t.exposeFloat("cooling"),
        // indirect relations
        configurations: t.relation("configurations"),
        schedules: t.relation("schedules"),
      }),
    });

    this.SetpointFields = builder.enumType("SetpointFields", {
      values: Object.values(Prisma.SetpointScalarFieldEnum),
    });
  }
}
