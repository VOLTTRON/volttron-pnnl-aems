import { RoleEnum } from "@/common/types";

export type CredentialType = "text" | "password";

export type AuthRoles = {
  [key in RoleEnum]: boolean;
};

export interface AuthUser {
  id?: string;
  roles: AuthRoles;
}

export interface Credential {
  label: string;
  type: CredentialType;
  placeholder?: string;
}

export type Credentials = Record<string, Credential>;

export type Values<T extends Credentials> = { [K in keyof T]: string };

export interface ProviderInfo<T extends Credentials> {
  name: string;
  label: string;
  credentials: T;
}
