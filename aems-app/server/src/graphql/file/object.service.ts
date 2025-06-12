import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { Prisma } from "@prisma/client";
import { PothosObject } from "../pothos.decorator";

@Injectable()
@PothosObject()
export class FileObject {
  readonly FileObject;
  readonly FileFields;

  constructor(builder: SchemaBuilderService) {
    this.FileObject = builder.prismaObject("File", {
      authScopes: { user: true },
      fields: (t) => ({
        // key
        id: t.exposeString("id", { authScopes: { user: true } }),
        // fields
        mimeType: t.exposeString("mimeType", { authScopes: { user: true } }),
        objectKey: t.exposeString("objectKey", { authScopes: { user: true } }),
        contentLength: t.exposeInt("contentLength", { authScopes: { user: true } }),
        // metadata
        createdAt: t.expose("createdAt", { type: builder.DateTime, authScopes: { user: true } }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime, authScopes: { user: true } }),
        // foreign keys
        userId: t.exposeString("userId", { authScopes: { user: true }, nullable: true }),
        feedbackId: t.exposeString("feedbackId", { authScopes: { user: true }, nullable: true }),
        // direct relations
        user: t.relation("user", { authScopes: { user: true }, nullable: true }),
        feedback: t.relation("feedback", { authScopes: { user: true }, nullable: true }),
      }),
    });

    this.FileFields = builder.enumType("FileFields", {
      values: Object.values(Prisma.FileScalarFieldEnum),
    });
  }
}
