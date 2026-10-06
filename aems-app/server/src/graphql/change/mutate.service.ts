import { Injectable } from "@nestjs/common";
import { Mutation } from "@local/common";
import { SchemaBuilderService } from "../builder.service";
import { ChangeQuery } from "./query.service";
import { ChangeObject } from "./object.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

@Injectable()
@PothosMutation()
export class ChangeMutation {
  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    changeQuery: ChangeQuery,
    _changeObject: ChangeObject,
  ) {
    const { ChangeWhereUnique } = changeQuery;
    // Only the server writes change records (ChangeService); an admin may delete one, and no API
    // creates or edits one.
    builder.mutationField("deleteChange", (t) =>
      t.prismaField({
        description: "Delete the specified change.",
        authScopes: { admin: true },
        type: "Change",
        args: {
          where: t.arg({ type: ChangeWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.change
            .delete({
              ...query,
              where: args.where,
            })
            .then(async (change) => {
              await subscriptionService.publish("Change", {
                topic: "Change",
                id: change.id,
                mutation: Mutation.Deleted,
              });
              await subscriptionService.publish(`Change/${change.id}`, {
                topic: "Change",
                id: change.id,
                mutation: Mutation.Deleted,
              });
              return change;
            });
        },
      }),
    );
  }
}
