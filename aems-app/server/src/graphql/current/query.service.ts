import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosQuery } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
@PothosQuery()
export class CurrentQuery {
  constructor(builder: SchemaBuilderService, prismaService: PrismaService) {
    builder.queryField("readCurrent", (t) =>
      t.prismaField({
        description: "Read the currently logged in user.",
        type: "User",
        nullable: true,
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, ctx, _info) => {
          if (ctx.user?.id) {
            subscriptions.register(`User/${ctx.user.id}`);
          }
        },
        resolve: async (query, _root, args, ctx, _info) => {
          if (!ctx.user?.id) {
            return Promise.resolve(null);
          }
          return prismaService.prisma.user.findUniqueOrThrow({
            ...query,
            ...args,
            where: { id: ctx.user.id },
          });
        },
      }),
    );
  }
}
