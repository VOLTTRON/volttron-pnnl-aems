import { enum_log } from "@prisma/client";

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
  /**
   * Parse the supplied value and return the located type or undefined if not located.
   */
  parse: IParse<T>;

  /**
   * Parse the supplied value and return the located type or throw an error if not located.
   */
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

export interface ILog extends IEnum<enum_log> {
  level: string;
}

/**
 * Determines if the type is allowed in the set of supplied set of type(s).
 */
export type IAllowed<T> = (...type: (T | number | string)[]) => boolean;

/**
 * Process the value by applying the normalizations to it.
 */
export type IProcess = (value: string | undefined | null) => string | undefined | null;

export interface INormalization extends IConstant {
  unallowed: string[];
  allowed: IAllowed<INormalization>;
  process: IProcess;
}

/**
 * Determines if the role is granted by the value(s).
 * I.e. Is the role lead granted to roles user and status?
 * Written as: `role.Lead.granted("user", "status") === false`
 */
export type IGranted = (...value: (IRole | number | string)[]) => boolean;

export enum RoleEnum {
  Super = "super",
  Admin = "admin",
  User = "user",
}

export interface IRole extends IEnum<RoleEnum> {
  grants: string[];
  granted: IGranted;
}

export enum HttpStatusEnum {
  Information = "information",
  Success = "success",
  Redirect = "redirect",
  ClientError = "client-error",
  ServerError = "server-error",
}

export interface IHttpStatus extends IEnum<HttpStatusEnum> {
  status: number;
  statusText: string;
  message: string;
}
