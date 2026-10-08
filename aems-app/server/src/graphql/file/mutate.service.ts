import { Inject, Injectable, Logger } from "@nestjs/common";
import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { SchemaBuilderService } from "../builder.service";
import { FileQuery } from "./query.service";
import { UserQuery } from "../user/query.service";
import { Prisma } from "@prisma/client";
import { Mutation } from "@local/common";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { AppConfigService } from "@/app.config";

// Remove the file at <uploadDir>/<objectKey>. A missing file does not stop the delete.
export async function unlinkFileBytes(
  uploadDir: string,
  objectKey: string | null | undefined,
  logger: Logger,
): Promise<void> {
  if (!objectKey) return;
  const filePath = resolve(uploadDir, objectKey);
  try {
    await unlink(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      logger.debug(`File bytes already gone at ${filePath}`);
      return;
    }
    throw err;
  }
}

@Injectable()
@PothosMutation()
export class FileMutation {
  private readonly logger = new Logger(FileMutation.name);

  readonly FileUpdateUser;
  readonly FileCreate;
  readonly FileUpdate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    fileQuery: FileQuery,
    userQuery: UserQuery,
    @Inject(AppConfigService.Key) configService: AppConfigService,
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
          const { objectKey, mimeType, contentLength } = args.create;
          const file: Prisma.FileCreateInput = { objectKey, mimeType, contentLength } as Prisma.FileCreateInput;
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

    const logger = this.logger;

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
              const uploadDir = resolve(process.cwd(), configService.file.uploadPath);
              await unlinkFileBytes(uploadDir, file.objectKey, logger);
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
