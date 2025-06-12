import { Mode, Mutation, SubscriptionEvent, SubscriptionTopic } from "@local/common";
import { BaseContext } from "@apollo/server";
import { LogType, FeedbackStatus } from "@prisma/client";
import { PubSubEngine } from "graphql-subscriptions";
import "@local/prisma";
export interface PubSubEngineExt extends PubSubEngine {
    publish<T extends SubscriptionTopic>(topic: T | `${T}/${string}`, payload: SubscriptionEvent<T>): Promise<void>;
    subscribe<T extends SubscriptionTopic>(topic: T | `${T}/${string}`, onMessage: (event: SubscriptionEvent<T>) => Promise<void> | void, options: object): Promise<number>;
    unsubscribe(subId: number): void;
    asyncIterator<T>(topics: string | string[]): AsyncIterator<T>;
}
export interface Context extends BaseContext {
    user: Express.User | undefined;
}
export type Scalars = {
    DateTime: {
        Input: Date;
        Output: Date;
    };
    Json: {
        Input: object;
        Output: object;
    };
    LogType: {
        Input: LogType;
        Output: LogType;
    };
    FeedbackStatus: {
        Input: FeedbackStatus;
        Output: FeedbackStatus;
    };
    Mode: {
        Input: Mode;
        Output: Mode;
    };
    Mutation: {
        Input: Mutation;
        Output: Mutation;
    };
    UserPreferences: {
        Input: PrismaJson.UserPreferences;
        Output: PrismaJson.UserPreferences;
    };
    SessionData: {
        Input: PrismaJson.SessionData;
        Output: PrismaJson.SessionData;
    };
    EventPayload: {
        Input: PrismaJson.EventPayload;
        Output: PrismaJson.EventPayload;
    };
    GeographyGeoJson: {
        Input: PrismaJson.GeographyGeoJson;
        Output: PrismaJson.GeographyGeoJson;
    };
    AccountGroupBy: {
        Input: PrismaJson.AccountGroupBy;
        Output: PrismaJson.AccountGroupBy;
    };
    BannerGroupBy: {
        Input: PrismaJson.BannerGroupBy;
        Output: PrismaJson.BannerGroupBy;
    };
    CommentGroupBy: {
        Input: PrismaJson.CommentGroupBy;
        Output: PrismaJson.CommentGroupBy;
    };
    FeedbackGroupBy: {
        Input: PrismaJson.FeedbackGroupBy;
        Output: PrismaJson.FeedbackGroupBy;
    };
    FileGroupBy: {
        Input: PrismaJson.FileGroupBy;
        Output: PrismaJson.FileGroupBy;
    };
    GeographyGroupBy: {
        Input: PrismaJson.GeographyGroupBy;
        Output: PrismaJson.GeographyGroupBy;
    };
    LogGroupBy: {
        Input: PrismaJson.LogGroupBy;
        Output: PrismaJson.LogGroupBy;
    };
    UserGroupBy: {
        Input: PrismaJson.UserGroupBy;
        Output: PrismaJson.UserGroupBy;
    };
};
export interface Aggregate<T extends string> {
    average?: T[] | null;
    count?: T[] | null;
    maximum?: T[] | null;
    minimum?: T[] | null;
    sum?: T[] | null;
}
export type GroupByInput<T extends {
    _avg?: any;
    _count?: any;
    _max?: any;
    _min?: any;
    _sum?: any;
}> = Pick<Partial<T>, "_avg" | "_count" | "_max" | "_min" | "_sum"> & {
    _count?: object;
};
export interface GroupBy<T extends string> {
    _avg?: {
        [k in T]: boolean | null;
    };
    _count?: {
        [k in T]: boolean | null;
    };
    _max?: {
        [k in T]: boolean | null;
    };
    _min?: {
        [k in T]: boolean | null;
    };
    _sum?: {
        [k in T]: boolean | null;
    };
}
