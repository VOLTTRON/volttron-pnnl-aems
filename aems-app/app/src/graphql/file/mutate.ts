import { builder } from "../builder";
import { prisma } from "@/prisma";
import { pick } from "lodash";
import { Prisma } from "@prisma/client";
import { UserWhereUnique } from "../user/query";

const FileCreateUser = builder.prismaCreateRelation("File", "user", {
    fields: {
        connect: UserWhereUnique,
    },
});

export const FileCreate = builder.prismaCreate("File", {
    fields: {
        objectKey: "String",
        mimeType: "String",
        contentLength: "Int",
        user: FileCreateUser
    },
});

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
            const auth = ctx.authUser;
            const create = args.create;

            if (!auth.roles.admin || !create.user) {
                delete create.user;
                create.user = { connect: { id: auth.id } };
            }

            return prisma.file.create({
                ...query,
                data: file,
            });
        },
    })
);