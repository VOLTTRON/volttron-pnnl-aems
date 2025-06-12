import { FeedbackStatus, LogType } from "@prisma/client";
export type IMatcher = (value: string) => string;
export interface IConstant {
    name: string;
    label: string;
    title?: string;
    description?: string;
}
export type IParse<T extends IConstant> = (value: T | number | string) => T | undefined;
export type IParseStrict<T extends IConstant> = (value: T | number | string) => T;
export interface IBase<T extends IConstant> {
    parse: IParse<T>;
    parseStrict: IParseStrict<T>;
}
export interface IFrequency extends IConstant {
    abbr: string;
    plural: string;
    pattern: {
        postgres: string;
        mysql: string;
    };
}
export interface IEnum<T> extends IConstant {
    enum: T;
}
export interface ILog extends IEnum<LogType> {
    level: string;
}
export interface IFeedbackStatus extends IEnum<FeedbackStatus> {
}
export type IAllowed<T> = (...type: (T | number | string)[]) => boolean;
export type IProcess = (value: string | undefined | null) => string | undefined | null;
export interface INormalization extends IConstant {
    unallowed: string[];
    allowed: IAllowed<INormalization>;
    process: IProcess;
}
export type IGranted = (...value: (IRole | number | string)[]) => boolean;
export declare enum RoleEnum {
    Super = "super",
    Admin = "admin",
    User = "user"
}
export interface IRole extends IEnum<RoleEnum> {
    grants: string[];
    granted: IGranted;
}
export declare enum HttpStatusEnum {
    Information = "information",
    Success = "success",
    Redirect = "redirect",
    ClientError = "client-error",
    ServerError = "server-error"
}
export interface IHttpStatus extends IEnum<HttpStatusEnum> {
    status: number;
    statusText: string;
    message: string;
}
