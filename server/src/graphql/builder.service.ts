import { AuthRoles, AuthUser } from "@/auth";
import { Mode, Mutation } from "@local/common";
import SchemaBuilder from "@pothos/core";
import ComplexityPlugin from "@pothos/plugin-complexity";
import PrismaPlugin from "@pothos/plugin-prisma";
import PrismaUtils from "@pothos/plugin-prisma-utils";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import SmartSubscriptionsPlugin, { subscribeOptionsFromIterator } from "@pothos/plugin-smart-subscriptions";
import RelayPlugin from "@pothos/plugin-relay";
import { Context, Scalars, Aggregate, GroupByInput } from ".";
import { set } from "lodash";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { setInterval } from "node:timers/promises";
import { GraphQLScalarType, GraphQLSchema } from "graphql";
import { PothosBuilder } from "./pothos.decorator";
import { AppConfigService } from "@/app.config";
import PrismaTypes from "@local/prisma/dist/pothos";
import { JsonValue } from "@prisma/client/runtime/library";
import { SubscriptionService } from "@/subscription/subscription.service";

@Injectable()
@PothosBuilder()
export class SchemaBuilderService
  extends SchemaBuilder<{
    Context: Context;
    AuthScopes: AuthRoles;
    PrismaTypes: PrismaTypes;
    Scalars: Scalars;
  }>
  implements OnModuleInit
{
  private initialized = false;
  readonly DateTime;
  readonly Json;
  readonly Mode;
  readonly Mutation;
  readonly BooleanFilter;
  readonly IntFilter;
  readonly FloatFilter;
  readonly StringFilter;
  readonly DateTimeFilter;
  readonly PagingInput;

  constructor(
    prismaService: PrismaService,
    @Inject(AppConfigService.Key) configService: AppConfigService,
    subscriptionService: SubscriptionService,
  ) {
    super({
      plugins: [RelayPlugin, ScopeAuthPlugin, PrismaPlugin, PrismaUtils, SmartSubscriptionsPlugin, ComplexityPlugin],
      relay: {},
      scopeAuth: {
        // Recommended when using subscriptions
        // when this is not set, auth checks are run when event is resolved rather than when the subscription is created
        authorizeOnSubscribe: true,
        treatErrorsAsUnauthorized: true,
        authScopes: (context) => context.user?.authRoles ?? new AuthUser().roles,
      },
      prisma: {
        client: prismaService.prisma,
        // defaults to false, uses /// comments from prisma schema as descriptions
        // for object types, relations and exposed fields.
        // descriptions can be omitted by setting description to false
        // exposeDescriptions: boolean | { models: boolean, fields: boolean },
        exposeDescriptions: true,
        // use where clause from prismaRelatedConnection for totalCount (will true by default in next major version)
        filterConnectionTotalCount: true,
        // warn when not using a query parameter correctly
        onUnusedQuery: configService.nodeEnv === "production" ? null : "warn",
      },
      smartSubscriptions: {
        ...subscribeOptionsFromIterator((topic) => {
          return subscriptionService.asyncIterator(topic);
        }),
      },
      complexity: {
        defaultComplexity: 1,
        defaultListMultiplier: 10,
        limit: {
          complexity: 500,
          depth: 5,
        },
      },
    });

    // global enum types
    this.Mode = this.enumType("ModeType", { values: Object.values(Mode) });
    this.Mutation = this.enumType("MutationType", { values: Object.values(Mutation) });

    // global scalar types
    this.DateTime = this.addScalarType(
      "DateTime",
      new GraphQLScalarType<Date, string>({
        name: "DateTime",
      }),
    );
    this.Json = this.addScalarType(
      "Json",
      new GraphQLScalarType<JsonValue, unknown>({
        name: "Json",
      }),
    );

    // base types
    this.queryType({});
    this.mutationType({});
    this.subscriptionType({});

    // global filter types
    this.BooleanFilter = this.prismaFilter("Boolean", {
      ops: ["equals", "not"],
    });
    this.IntFilter = this.prismaFilter("Int", {
      ops: ["equals", "gt", "gte", "lt", "lte", "not", "in"],
    });
    this.FloatFilter = this.prismaFilter("Float", {
      ops: ["equals", "gt", "gte", "lt", "lte", "not", "in"],
    });
    this.StringFilter = this.prismaFilter("String", {
      ops: ["contains", "equals", "startsWith", "endsWith", "not", "in", "mode"],
    });
    this.DateTimeFilter = this.prismaFilter("DateTime", {
      ops: ["contains", "equals", "gt", "gte", "lt", "lte", "not", "in", "mode"],
    });

    // global input types
    this.PagingInput = this.inputType("PagingInput", {
      fields: (t) => ({
        skip: t.int({ required: true }),
        take: t.int({ required: true }),
      }),
    });
  }

  onModuleInit() {
    this.initialized = true;
  }

  awaitSchema(): Promise<GraphQLSchema> {
    if (this.initialized) {
      return Promise.resolve(super.toSchema());
    } else {
      const controller = new AbortController();
      const { signal } = controller;
      setTimeout(() => controller.abort(), 60000);
      return new Promise<GraphQLSchema>((resolve) => {
        setInterval(
          100,
          () => {
            if (this.initialized) {
              resolve(super.toSchema());
              controller.abort();
            }
          },
          { signal },
        );
      });
    }
  }

  static aggregateToGroupBy<
    T extends { _avg?: any; _count?: any; _max?: any; _min?: any; _sum?: any },
    F extends string,
    // dynamic type-safe output not possible using static graphql types
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  >(aggregate?: Aggregate<F> | null): {} {
    const temp: GroupByInput<T> = {};
    [
      { src: "average" as keyof Aggregate<F>, dst: "_avg" as keyof GroupByInput<T> },
      { src: "count" as keyof Aggregate<F>, dst: "_count" as keyof GroupByInput<T> },
      { src: "maximum" as keyof Aggregate<F>, dst: "_max" as keyof GroupByInput<T> },
      { src: "minimum" as keyof Aggregate<F>, dst: "_min" as keyof GroupByInput<T> },
      { src: "sum" as keyof Aggregate<F>, dst: "_sum" as keyof GroupByInput<T> },
    ].forEach(({ src, dst }) => {
      const fields = aggregate?.[src];
      if (fields) {
        temp[dst] = fields.reduce((a, v) => set(a, v, true), {} as { [k in F]: boolean | null });
      }
    });
    return temp;
  }
}
