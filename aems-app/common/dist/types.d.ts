import { Prisma } from "@prisma/client";
declare global {
    namespace session {
        interface SessionData {
        }
    }
    namespace PrismaJson {
        type UserPreferences = Partial<Preferences>;
        type SessionData = session.SessionData;
        type EventPayload = SubscriptionEvent<SubscriptionTopic>;
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
}
