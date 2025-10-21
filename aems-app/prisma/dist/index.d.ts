import { Prisma } from "@prisma/client";
export * from "./pothos";
declare global {
    namespace session {
        interface SessionData {
        }
    }
    namespace PrismaJson {
        type UserPreferences = Partial<Preferences>;
        type SessionData = session.SessionData;
        type EventPayload = SubscriptionEvent<SubscriptionTopic>;
        type GeographyGeoJson = GeoJSON.GeoJSON;
        type ChangeData = Prisma.JsonValue;
        type AccountGroupBy = Partial<Omit<Prisma.AccountGroupByOutputType, "_count">> & {
            _count?: Partial<Prisma.AccountGroupByOutputType["_count"]>;
        };
        type BannerGroupBy = Partial<Omit<Prisma.BannerGroupByOutputType, "_count">> & {
            _count?: Partial<Prisma.BannerGroupByOutputType["_count"]>;
        };
        type ChangeGroupBy = Partial<Omit<Prisma.ChangeGroupByOutputType, "_count">> & {
            _count?: Partial<Prisma.ChangeGroupByOutputType["_count"]>;
        };
        type CommentGroupBy = Partial<Omit<Prisma.CommentGroupByOutputType, "_count">> & {
            _count?: Partial<Prisma.CommentGroupByOutputType["_count"]>;
        };
        type ConfigurationGroupBy = Partial<Omit<Prisma.ConfigurationGroupByOutputType, "_count">> & {
            _count?: Partial<Prisma.ConfigurationGroupByOutputType["_count"]>;
        };
        type ControlGroupBy = Partial<Omit<Prisma.ControlGroupByOutputType, "_count">> & {
            _count?: Partial<Prisma.ControlGroupByOutputType["_count"]>;
        };
        type FeedbackGroupBy = Partial<Omit<Prisma.FeedbackGroupByOutputType, "_count">> & {
            _count?: Partial<Prisma.FeedbackGroupByOutputType["_count"]>;
        };
        type FileGroupBy = Partial<Omit<Prisma.FileGroupByOutputType, "_count">> & {
            _count?: Partial<Prisma.FileGroupByOutputType["_count"]>;
        };
        type GeographyGroupBy = Partial<Omit<Prisma.GeographyGroupByOutputType, "_count">> & {
            _count?: Partial<Prisma.GeographyGroupByOutputType["_count"]>;
        };
        type HolidayGroupBy = Partial<Omit<Prisma.HolidayGroupByOutputType, "_count">> & {
            _count?: Partial<Prisma.HolidayGroupByOutputType["_count"]>;
        };
        type LocationGroupBy = Partial<Omit<Prisma.LocationGroupByOutputType, "_count">> & {
            _count?: Partial<Prisma.LocationGroupByOutputType["_count"]>;
        };
        type LogGroupBy = Partial<Omit<Prisma.LogGroupByOutputType, "_count">> & {
            _count?: Partial<Prisma.LogGroupByOutputType["_count"]>;
        };
        type OccupancyGroupBy = Partial<Omit<Prisma.OccupancyGroupByOutputType, "_count">> & {
            _count?: Partial<Prisma.OccupancyGroupByOutputType["_count"]>;
        };
        type ScheduleGroupBy = Partial<Omit<Prisma.ScheduleGroupByOutputType, "_count">> & {
            _count?: Partial<Prisma.ScheduleGroupByOutputType["_count"]>;
        };
        type SetpointGroupBy = Partial<Omit<Prisma.SetpointGroupByOutputType, "_count">> & {
            _count?: Partial<Prisma.SetpointGroupByOutputType["_count"]>;
        };
        type UnitGroupBy = Partial<Omit<Prisma.UnitGroupByOutputType, "_count">> & {
            _count?: Partial<Prisma.UnitGroupByOutputType["_count"]>;
        };
        type UserGroupBy = Partial<Omit<Prisma.UserGroupByOutputType, "_count">> & {
            _count?: Partial<Prisma.UserGroupByOutputType["_count"]>;
        };
    }
}
export interface Preferences {
    theme: string;
    mode: Mode;
    name: string;
}
export declare enum Mode {
    Light = "light",
    Dark = "dark"
}
export declare enum Mutation {
    Created = "create",
    Updated = "update",
    Deleted = "delete"
}
export type SubscriptionTopic = Prisma.ModelName | "Current";
export interface SubscriptionEvent<T extends SubscriptionTopic> {
    topic: T;
    id: string;
    mutation: Mutation;
}
export type CredentialType = "text" | "password";
export interface Credential {
    label: string;
    type: CredentialType;
    placeholder?: string;
}
export type Credentials = Record<string, Credential>;
export interface ProviderInfo<T extends Credentials> {
    name: string;
    label: string;
    credentials: T;
    endpoint: string;
}
export {};
