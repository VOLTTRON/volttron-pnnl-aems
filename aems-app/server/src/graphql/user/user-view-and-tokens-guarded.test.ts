import { SchemaBuilderService } from "../builder.service";
import { UserObject, selfOrAdmin } from "./object.service";
import { AccountObject } from "../account/object.service";
import { AccountQuery } from "../account/query.service";
import { AccountMutation } from "../account/mutate.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { UserQuery } from "./query.service";
import { Context } from "..";

type FieldCfg = { type?: unknown; nullable?: boolean; authScopes?: unknown };

type UserCaptured = Record<
  string,
  { kind: "scalar" | "relation"; field: string; authScopes?: unknown; nullable?: boolean }
>;
type AccountCaptured = Record<string, { kind: string; field: string; authScopes?: unknown }>;

function captureUserObjectFields() {
  let userFields: UserCaptured | undefined;
  const t = new Proxy({} as Record<string, (...a: unknown[]) => unknown>, {
    get: (_target, prop: string) => {
      if (prop === "exposeString" || prop === "exposeInt" || prop === "expose") {
        return (field: string, opts: FieldCfg = {}) => ({ kind: "scalar", field, ...opts });
      }
      if (prop === "relation") {
        return (field: string, opts: FieldCfg = {}) => ({ kind: "relation", field, ...opts });
      }
      return () => prop;
    },
  });
  const builder = {
    DateTime: "DateTime",
    addScalarType: jest.fn((name: string) => name),
    prismaObject: jest.fn(
      (_name: string, cfg: { fields: (tt: unknown) => UserCaptured }) => {
        userFields = cfg.fields(t);
        return {};
      },
    ),
    enumType: jest.fn((name: string) => name),
  } as unknown as SchemaBuilderService;
  return { builder, get: () => userFields };
}

function captureAccountObjectFields() {
  let accountTypeAuthScopes: unknown;
  let accountFields: AccountCaptured | undefined;
  const t = new Proxy({} as Record<string, (...a: unknown[]) => unknown>, {
    get: (_target, prop: string) => {
      if (prop === "exposeString" || prop === "exposeInt" || prop === "expose") {
        return (field: string, opts: FieldCfg = {}) => ({ kind: "scalar", field, ...opts });
      }
      if (prop === "relation") {
        return (field: string, opts: FieldCfg = {}) => ({ kind: "relation", field, ...opts });
      }
      return () => prop;
    },
  });
  const builder = {
    DateTime: "DateTime",
    prismaObject: jest.fn(
      (_name: string, cfg: { authScopes?: unknown; fields: (tt: unknown) => AccountCaptured }) => {
        accountTypeAuthScopes = cfg.authScopes;
        accountFields = cfg.fields(t);
        return {};
      },
    ),
    enumType: jest.fn((name: string) => name),
  } as unknown as SchemaBuilderService;
  return { builder, get: () => ({ accountTypeAuthScopes, accountFields }) };
}

function captureAccountResolvers() {
  const resolvers: Record<string, { authScopes?: unknown }> = {};
  const mockT = {
    prismaConnection: jest.fn((opts: any) => opts),
    prismaField: jest.fn((opts: any) => opts),
    field: jest.fn((opts: any) => opts),
    arg: jest.fn((opts: any) => opts),
  };
  const builder = {
    StringFilter: "StringFilter",
    DateTimeFilter: "DateTimeFilter",
    PagingInput: "PagingInput",
    prismaWhereUnique: jest.fn(() => "whereUnique"),
    prismaWhere: jest.fn(() => "where"),
    prismaOrderBy: jest.fn(() => "orderBy"),
    inputType: jest.fn(() => "inputType"),
    addScalarType: jest.fn(),
    queryField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = { authScopes: opts.authScopes };
    }),
  } as unknown as SchemaBuilderService;
  return { builder, resolvers };
}

function captureAccountMutationInputs() {
  const inputs: { create?: Record<string, unknown>; update?: Record<string, unknown> } = {};
  const mockT = {
    prismaField: jest.fn((opts: any) => opts),
    arg: jest.fn((opts: any) => opts),
  };
  const builder = {
    prismaCreateRelation: jest.fn(() => "rel"),
    prismaUpdateRelation: jest.fn(() => "rel"),
    prismaCreate: jest.fn((_name: string, cfg: { fields: Record<string, unknown> }) => {
      inputs.create = cfg.fields;
      return "AccountCreate";
    }),
    prismaUpdate: jest.fn((_name: string, cfg: { fields: Record<string, unknown> }) => {
      inputs.update = cfg.fields;
      return "AccountUpdate";
    }),
    mutationField: jest.fn((_name: string, cb: (t: unknown) => any) => cb(mockT)),
  } as unknown as SchemaBuilderService;
  return { builder, inputs };
}

// scenario: user-view-and-tokens-guarded
describe("User fields guarded self-or-admin; accounts are admin-only; no token field exposed", () => {
  describe("UserObject fields", () => {
    it("id and name have no field-level authScopes (visible to every signed-in user)", () => {
      const cap = captureUserObjectFields();
      new UserObject(cap.builder);
      const fields = cap.get()!;
      expect(fields["id"].authScopes).toBeUndefined();
      expect(fields["name"].authScopes).toBeUndefined();
    });

    it("every other field has a selfOrAdmin authScopes function", () => {
      const cap = captureUserObjectFields();
      new UserObject(cap.builder);
      const fields = cap.get()!;
      const guarded = ["email", "image", "emailVerified", "role", "preferences", "createdAt", "updatedAt", "comments", "accounts", "banners", "units"];
      for (const name of guarded) {
        expect(fields[name]).toBeDefined();
        expect(typeof fields[name].authScopes).toBe("function");
      }
    });

    it("password is not exposed", () => {
      const cap = captureUserObjectFields();
      new UserObject(cap.builder);
      const fields = cap.get()!;
      expect(fields["password"]).toBeUndefined();
    });

    describe("selfOrAdmin helper", () => {
      const ctx = (admin: boolean, id?: string): Context =>
        ({ user: { id, authRoles: { admin, user: true, super: false } } } as unknown as Context);

      it("self (parent.id === ctx.user.id): returns { user: true } — any signed-in user passes", () => {
        expect(selfOrAdmin({ id: "u1" }, ctx(false, "u1"))).toEqual({ user: true });
      });

      it("admin reading someone else: returns { admin: true } — admin scope passes", () => {
        expect(selfOrAdmin({ id: "u2" }, ctx(true, "u1"))).toEqual({ admin: true });
      });

      it("other-user (not self, not admin): returns { admin: true } — scope not held so field refused", () => {
        expect(selfOrAdmin({ id: "u2" }, ctx(false, "u1"))).toEqual({ admin: true });
      });

      it("anonymous caller: returns { admin: true } — field refused", () => {
        expect(selfOrAdmin({ id: "u1" }, { user: undefined } as unknown as Context)).toEqual({ admin: true });
      });
    });
  });

  describe("AccountObject", () => {
    it("Account type is admin-only at type level", () => {
      const cap = captureAccountObjectFields();
      new AccountObject(cap.builder);
      expect(cap.get().accountTypeAuthScopes).toEqual({ admin: true });
    });

    it("no field exposes refresh_token, access_token, token_type, id_token or session_state", () => {
      const cap = captureAccountObjectFields();
      new AccountObject(cap.builder);
      const keys = Object.keys(cap.get().accountFields ?? {});
      for (const forbidden of ["refresh_token", "access_token", "token_type", "id_token", "session_state"]) {
        expect(keys).not.toContain(forbidden);
      }
    });

    it("negative control: still exposes id, provider and type (object is not empty)", () => {
      const cap = captureAccountObjectFields();
      new AccountObject(cap.builder);
      const keys = Object.keys(cap.get().accountFields ?? {});
      expect(keys).toContain("id");
      expect(keys).toContain("provider");
      expect(keys).toContain("type");
    });
  });

  describe("AccountQuery resolvers", () => {
    it("all five read paths require admin", () => {
      const cap = captureAccountResolvers();
      new AccountQuery(cap.builder, {} as PrismaService, {} as AccountObject, {
        UserWhereUnique: "UserWhereUnique",
        UserOrderBy: "UserOrderBy",
      } as unknown as UserQuery);
      for (const name of ["pageAccount", "readAccount", "readAccounts", "countAccounts", "groupAccounts"]) {
        expect(cap.resolvers[name]).toBeDefined();
        expect(cap.resolvers[name].authScopes).toEqual({ admin: true });
      }
    });
  });

  describe("AccountMutation inputs", () => {
    it("AccountCreate and AccountUpdate expose no token fields", () => {
      const cap = captureAccountMutationInputs();
      new AccountMutation(
        cap.builder,
        {} as PrismaService,
        { publish: jest.fn() } as unknown as SubscriptionService,
        { AccountWhereUnique: "AccountWhereUnique" } as unknown as AccountQuery,
        { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery,
      );
      for (const forbidden of ["refresh_token", "access_token", "token_type", "id_token", "session_state"]) {
        expect(Object.keys(cap.inputs.create ?? {})).not.toContain(forbidden);
        expect(Object.keys(cap.inputs.update ?? {})).not.toContain(forbidden);
      }
    });
  });
});
