import { Prisma } from "@prisma/client";
export * from "./pothos";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace session {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface SessionData {}
  }
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    type UserPreferences = Partial<Preferences>;
    type SessionData = session.SessionData;
    type EventPayload = SubscriptionEvent<SubscriptionTopic>;
    type GeographyGeoJson = GeoJSON.GeoJSON;
    type AccountGroupBy = Partial<Omit<Prisma.AccountGroupByOutputType, "_count">> & {
      _count?: Partial<Prisma.AccountGroupByOutputType["_count"]>;
    };
    type BannerGroupBy = Partial<Omit<Prisma.BannerGroupByOutputType, "_count">> & {
      _count?: Partial<Prisma.BannerGroupByOutputType["_count"]>;
    };
    type CommentGroupBy = Partial<Omit<Prisma.CommentGroupByOutputType, "_count">> & {
      _count?: Partial<Prisma.CommentGroupByOutputType["_count"]>;
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
    type LogGroupBy = Partial<Omit<Prisma.LogGroupByOutputType, "_count">> & {
      _count?: Partial<Prisma.LogGroupByOutputType["_count"]>;
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

export enum Mode {
  Light = "light",
  Dark = "dark",
}

export enum Mutation {
  Created = "create",
  Updated = "update",
  Deleted = "delete",
}

// add additional topics that don't have a corresponding model name here
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
}

export {};
