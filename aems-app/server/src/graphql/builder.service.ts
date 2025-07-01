import { AuthRoles, AuthUser } from "@/auth";
import { FeedbackStatus, LogType, Mode, Mutation } from "@local/common";
import { ModelStage, HolidayType } from "@prisma/client";
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
  readonly LogType;
  readonly FeedbackStatus;
  readonly Mode;
  readonly Mutation;
  readonly UserPreferences;
  readonly SessionData;
  readonly EventPayload;
  readonly GeographyGeoJson;
  readonly ChangeData;
  readonly BooleanFilter;
  readonly IntFilter;
  readonly FloatFilter;
  readonly StringFilter;
  readonly DateTimeFilter;
  readonly LogTypeFilter;
  readonly FeedbackStatusFilter;
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

    // enum types
    this.LogType = this.enumType("LogType", { values: LogType.values.map((v) => v.enum) });
    this.FeedbackStatus = this.enumType("FeedbackStatus", { values: FeedbackStatus.values.map((v) => v.enum) });
    this.Mode = this.enumType("ModeType", { values: Object.values(Mode) });
    this.Mutation = this.enumType("MutationType", { values: Object.values(Mutation) });
    this.enumType("ModelStage", { values: Object.values(ModelStage) });
    this.enumType("HolidayType", { values: Object.values(HolidayType) });

    // scalar types
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
    this.UserPreferences = this.addScalarType(
      "UserPreferences",
      new GraphQLScalarType<Scalars["UserPreferences"]["Input"], Scalars["UserPreferences"]["Output"]>({
        name: "UserPreferences",
      }),
    );
    this.SessionData = this.addScalarType(
      "SessionData",
      new GraphQLScalarType<Scalars["SessionData"]["Input"], Scalars["SessionData"]["Output"]>({ name: "SessionData" }),
    );
    this.EventPayload = this.addScalarType(
      "EventPayload",
      new GraphQLScalarType<Scalars["EventPayload"]["Input"], Scalars["EventPayload"]["Output"]>({
        name: "EventPayload",
      }),
    );
    this.GeographyGeoJson = this.addScalarType(
      "GeographyGeoJson",
      new GraphQLScalarType<Scalars["GeographyGeoJson"]["Input"], Scalars["GeographyGeoJson"]["Output"]>({
        name: "GeographyGeoJson",
      }),
    );
    this.ChangeData = this.addScalarType(
      "ChangeData",
      new GraphQLScalarType<Scalars["ChangeData"]["Input"], Scalars["ChangeData"]["Output"]>({
        name: "ChangeData",
      }),
    );

    // group by types
    this.addScalarType(
      "AccountGroupBy",
      new GraphQLScalarType<Scalars["AccountGroupBy"]["Input"], Scalars["AccountGroupBy"]["Output"]>({
        name: "AccountGroupBy",
      }),
    );
    this.addScalarType(
      "BannerGroupBy",
      new GraphQLScalarType<Scalars["BannerGroupBy"]["Input"], Scalars["BannerGroupBy"]["Output"]>({
        name: "BannerGroupBy",
      }),
    );
    this.addScalarType(
      "CommentGroupBy",
      new GraphQLScalarType<Scalars["CommentGroupBy"]["Input"], Scalars["CommentGroupBy"]["Output"]>({
        name: "CommentGroupBy",
      }),
    );
    this.addScalarType(
      "FeedbackGroupBy",
      new GraphQLScalarType<Scalars["FeedbackGroupBy"]["Input"], Scalars["FeedbackGroupBy"]["Output"]>({
        name: "FeedbackGroupBy",
      }),
    );
    this.addScalarType(
      "FileGroupBy",
      new GraphQLScalarType<Scalars["FileGroupBy"]["Input"], Scalars["FileGroupBy"]["Output"]>({
        name: "FileGroupBy",
      }),
    );
    this.addScalarType(
      "GeographyGroupBy",
      new GraphQLScalarType<Scalars["GeographyGroupBy"]["Input"], Scalars["GeographyGroupBy"]["Output"]>({
        name: "GeographyGroupBy",
      }),
    );
    this.addScalarType(
      "LogGroupBy",
      new GraphQLScalarType<Scalars["LogGroupBy"]["Input"], Scalars["LogGroupBy"]["Output"]>({
        name: "LogGroupBy",
      }),
    );
    this.addScalarType(
      "UserGroupBy",
      new GraphQLScalarType<Scalars["UserGroupBy"]["Input"], Scalars["UserGroupBy"]["Output"]>({
        name: "UserGroupBy",
      }),
    );
    this.addScalarType(
      "ChangeGroupBy",
      new GraphQLScalarType<Scalars["ChangeGroupBy"]["Input"], Scalars["ChangeGroupBy"]["Output"]>({
        name: "ChangeGroupBy",
      }),
    );
    this.addScalarType(
      "LocationGroupBy",
      new GraphQLScalarType<Scalars["LocationGroupBy"]["Input"], Scalars["LocationGroupBy"]["Output"]>({
        name: "LocationGroupBy",
      }),
    );
    this.addScalarType(
      "SetpointGroupBy",
      new GraphQLScalarType<Scalars["SetpointGroupBy"]["Input"], Scalars["SetpointGroupBy"]["Output"]>({
        name: "SetpointGroupBy",
      }),
    );
    this.addScalarType(
      "ControlGroupBy",
      new GraphQLScalarType<Scalars["ControlGroupBy"]["Input"], Scalars["ControlGroupBy"]["Output"]>({
        name: "ControlGroupBy",
      }),
    );
    this.addScalarType(
      "HolidayGroupBy",
      new GraphQLScalarType<Scalars["HolidayGroupBy"]["Input"], Scalars["HolidayGroupBy"]["Output"]>({
        name: "HolidayGroupBy",
      }),
    );
    this.addScalarType(
      "ScheduleGroupBy",
      new GraphQLScalarType<Scalars["ScheduleGroupBy"]["Input"], Scalars["ScheduleGroupBy"]["Output"]>({
        name: "ScheduleGroupBy",
      }),
    );
    this.addScalarType(
      "ConfigurationGroupBy",
      new GraphQLScalarType<Scalars["ConfigurationGroupBy"]["Input"], Scalars["ConfigurationGroupBy"]["Output"]>({
        name: "ConfigurationGroupBy",
      }),
    );
    this.addScalarType(
      "UnitGroupBy",
      new GraphQLScalarType<Scalars["UnitGroupBy"]["Input"], Scalars["UnitGroupBy"]["Output"]>({
        name: "UnitGroupBy",
      }),
    );
    this.addScalarType(
      "OccupancyGroupBy",
      new GraphQLScalarType<Scalars["OccupancyGroupBy"]["Input"], Scalars["OccupancyGroupBy"]["Output"]>({
        name: "OccupancyGroupBy",
      }),
    );

    // base types
    this.queryType({});
    this.mutationType({});
    this.subscriptionType({});

    // input types
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
    this.LogTypeFilter = this.prismaFilter("LogType", {
      ops: ["equals", "not", "in", "mode"],
    });
    this.FeedbackStatusFilter = this.prismaFilter("FeedbackStatus", {
      ops: ["equals", "not", "in", "mode"],
    });
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

  awaitSchema(): GraphQLSchema | Promise<GraphQLSchema> {
    if (this.initialized) {
      return super.toSchema();
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
