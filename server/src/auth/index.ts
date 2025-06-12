import { HttpStatus, Role, typeofObject, RoleType, Credentials } from "@local/common";
import { ZxcvbnResult, zxcvbn } from "@zxcvbn-ts/core";
import { zxcvbnOptions } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";
import { User as PrismaUser, User } from "@prisma/client";
import { omit } from "lodash";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User extends Omit<PrismaUser, "password"> {
      authRoles: AuthRoles;
      roles: (typeof Role.User)[];
    }

    interface Request {
      user?: Express.User;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    passport?: { user?: string };
  }
}

export type AuthRoles = {
  [key in typeof Role.User.enum]: boolean;
};

interface IAuthUser {
  id?: string;
  roles: AuthRoles;
}

export type Values<T extends Credentials> = { [K in keyof T]: string };

export interface AuthResponse {
  user?: Express.User;
  cookies?: Record<string, string>;
  redirect?: string;
  error?: string;
}

export type Authorize<T extends Credentials, V extends Values<T>> = (
  credentials: V | null | undefined,
  options: { auth: AuthUser },
) =>
  | Promise<(AuthResponse & typeof HttpStatus.Accepted) | AuthResponse>
  | (AuthResponse & typeof HttpStatus.Accepted)
  | AuthResponse;

const authRoles = (role: string) => {
  const roles = role.split(/[, |]+/);
  return RoleType.values.reduce((a, v) => {
    a[v.enum] = v.granted(...roles) ?? false;
    return a;
  }, {} as AuthRoles);
};

export class AuthUser implements IAuthUser {
  readonly id?: string;
  readonly roles: AuthRoles;

  constructor(user?: Partial<User>);
  constructor(user?: Partial<Express.User>);
  constructor(id?: string, role?: string);
  constructor(id?: string, roles?: AuthRoles);
  constructor(...args: [Partial<User> | Partial<Express.User> | string | undefined, (AuthRoles | string)?]) {
    if (typeof args[0] === "object") {
      const prismaUser = typeofObject<Partial<User>>(args[0], (v) => "role" in v) ? args[0] : undefined;
      const expressUser = typeofObject<Partial<Express.User>>(args[0], (v) => "authRoles" in v) ? args[0] : undefined;
      this.id = prismaUser?.id ?? expressUser?.id;
      this.roles = expressUser?.authRoles ?? (prismaUser?.role ? authRoles(prismaUser.role) : authRoles(""));
    } else {
      this.id = args[0];
      this.roles = typeof args[1] === "string" ? authRoles(args[1]) : (args[1] ?? authRoles(""));
    }
  }
}

export function buildExpressUser(user: User | Omit<User, "password">): Express.User {
  return omit(
    {
      ...user,
      roles: (user.role?.split(",") ?? []).map((r) => RoleType.parse(r)).filter((r) => typeofObject(r)),
      authRoles: authRoles(user.role ?? ""),
    },
    "password",
  );
}

const options = {
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  translations: zxcvbnEnPackage.translations,
};
zxcvbnOptions.setOptions(options);

export const checkPassword = (password: string, userInputs?: (string | number)[]): ZxcvbnResult => {
  const value = zxcvbn(password, userInputs);
  return value;
};
