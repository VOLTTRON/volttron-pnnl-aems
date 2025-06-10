import { Preferences, UserPreferences } from "@/app/components/providers";
import { AuthUser } from "@/auth/types";
import { BaseContext } from "@apollo/server";
import { enum_log, enum_feedbackStatus, Prisma, enum_mutation } from "@prisma/client";
import { PubSubEngine } from "graphql-subscriptions";

export enum Mutation {
  Created = "create",
  Updated = "update",
  Deleted = "delete",
}

// add additional topics here if necessary
export type SubscriptionTopic = Prisma.ModelName | "Current";

export interface SubscriptionEvent<T extends SubscriptionTopic> {
  topic: T;
  id: string;
  mutation: Mutation;
}

export interface PubsubEngineExt extends PubSubEngine {
  publish<T extends SubscriptionTopic>(triggerName: T | `${T}/${string}`, payload: SubscriptionEvent<T>): Promise<void>;
  subscribe<T extends SubscriptionTopic>(
    triggerName: T | `${T}/${string}`,
    onMessage: (event: SubscriptionEvent<T>) => Promise<void> | void,
    options: {}
  ): Promise<number>;
  unsubscribe(subId: number): any;
  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T>;
}

export interface Context extends BaseContext {
  authUser: AuthUser;
  pubsub: PubsubEngineExt;
}

// simple types for importing scalars into graphql codegen.ts
export type DateType = Date | string;

export type SubscriptionEventType = SubscriptionEvent<SubscriptionTopic>;

export type UserPreferencesType = UserPreferences & Partial<Preferences>;

export type LogType = enum_log;

export type FeedbackStatusType = enum_feedbackStatus;

export type MutationType = enum_mutation;

/* eslint-disable */
export type Scalars = {
  DateTime: { Input: Date; Output: Date };
  JSON: { Input: any; Output: any };
  Event: { Input: SubscriptionEventType; Output: SubscriptionEventType };
  Preferences: { Input: UserPreferencesType; Output: UserPreferencesType };
  LogType: { Input: LogType; Output: LogType };
  FeedbackStatusType: { Input: FeedbackStatusType; Output: FeedbackStatusType };
  MutationType: { Input: MutationType; Output: MutationType };
};
/* eslint-enable */

export interface Aggregate<T extends string> {
  average?: T[] | null;
  count?: T[] | null;
  maximum?: T[] | null;
  minimum?: T[] | null;
  sum?: T[] | null;
}

export interface GroupBy<T extends string> {
  _avg?: { [k in T]: boolean | null };
  _count?: { [k in T]: boolean | null };
  _max?: { [k in T]: boolean | null };
  _min?: { [k in T]: boolean | null };
  _sum?: { [k in T]: boolean | null };
}
