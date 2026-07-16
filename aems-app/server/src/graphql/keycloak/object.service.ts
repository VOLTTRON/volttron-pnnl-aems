import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class KeycloakObject {
  readonly KeycloakRole;

  constructor(builder: SchemaBuilderService) {
    this.KeycloakRole = builder.objectRef<{ id: string; name: string }>("KeycloakRole").implement({
      fields: (t) => ({
        id: t.exposeString("id"),
        name: t.exposeString("name"),
      }),
    });
  }
}
