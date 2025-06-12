import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { FileQuery } from "./query.service";
import { UserQuery } from "../user/query.service";
import { Prisma } from "@prisma/client";
import { pick } from "lodash";
import { Mutation } from "@local/common";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

@Injectable()
@PothosMutation()
export class FileMutation {
  readonly FileUpdateUser;
  readonly FileCreate;
  readonly FileUpdate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    fileQuery: FileQuery,
    userQuery: UserQuery,
  ) {
    const { FileWhereUnique } = fileQuery;
    const { UserWhereUnique } = userQuery;

    this.FileUpdateUser = builder.prismaCreateRelation("File", "user", {
      fields: {
        connect: UserWhereUnique,
      },
    });

    this.FileCreate = builder.prismaCreate("File", {
      fields: {
        objectKey: "String",
        mimeType: "String",
        contentLength: "Int",
        user: this.FileUpdateUser,
      },
    });

    this.FileUpdate = builder.prismaUpdate("File", {
      fields: {
        objectKey: "String",
        mimeType: "String",
        contentLength: "Int",
        user: this.FileUpdateUser,
      },
    });

    const { FileCreate, FileUpdate } = this;

    builder.mutationField("createFile", (t) =>
      t.prismaField({
        description: "Create a local file record.",
        authScopes: { user: true },
        type: "File",
        args: {
          create: t.arg({ type: FileCreate, required: true }),
        },
        resolve: async (query, _root, args, ctx, _info) => {
          const file: Prisma.FileCreateInput = pick(args.create, ["objectKey", "mimeType", "contentLength"]);
          const create = args.create;
          if (!ctx.user?.authRoles.admin || !create.user) {
            delete create.user;
            create.user = { connect: { id: ctx.user?.id } };
          }
          return prismaService.prisma.file
            .create({
              ...query,
              data: file,
            })
            .then(async (file) => {
              await subscriptionService.publish("File", {
                topic: "File",
                id: file.id,
                mutation: Mutation.Created,
              });
              return file;
            });
        },
      }),
    );

    builder.mutationField("updateFile", (t) =>
      t.prismaField({
        description: "Update a local file record.",
        authScopes: { user: true },
        type: "File",
        args: {
          where: t.arg({ type: FileWhereUnique, required: true }),
          update: t.arg({ type: FileUpdate, required: true }),
        },
        resolve: async (query, _root, args, ctx, _info) => {
          const where = args.where ?? {};
          if (!ctx.user?.authRoles.admin) {
            delete where.user;
            where.userId = ctx.user?.id;
          }
          return prismaService.prisma.file
            .update({
              ...query,
              data: args.update,
              where,
            })
            .then(async (file) => {
              await subscriptionService.publish("File", {
                topic: "File",
                id: file.id,
                mutation: Mutation.Updated,
              });
              await subscriptionService.publish(`File/${file.id}`, {
                topic: "File",
                id: file.id,
                mutation: Mutation.Updated,
              });
              return file;
            });
        },
      }),
    );

    builder.mutationField("deleteFile", (t) =>
      t.prismaField({
        description: "Delete a local file record.",
        authScopes: { user: true },
        type: "File",
        args: {
          where: t.arg({ type: FileWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, ctx, _info) => {
          const where = args.where ?? {};
          if (!ctx.user?.authRoles.admin) {
            delete where.user;
            where.userId = ctx.user?.id;
          }
          return prismaService.prisma.file
            .delete({
              ...query,
              where,
            })
            .then(async (file) => {
              await subscriptionService.publish("File", {
                topic: "File",
                id: file.id,
                mutation: Mutation.Deleted,
              });
              await subscriptionService.publish(`File/${file.id}`, {
                topic: "File",
                id: file.id,
                mutation: Mutation.Deleted,
              });
              return file;
            });
        },
      }),
    );
  }
}
