import { FeedbackStatus } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
import { FileQuery } from "../file/query.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { FeedbackObject } from "./object.service";
import { FeedbackQuery } from "./query.service";
import { FeedbackMutation } from "./mutate.service";

type FieldCfg = { type?: unknown; nullable?: boolean; authScopes?: Record<string, unknown> };
type Fields = Record<string, FieldCfg>;

type Captured = {
  mutations: Record<
    string,
    { authScopes?: Record<string, boolean>; args: Record<string, { type: unknown; required?: boolean }> }
  >;
  feedbackCreateFields?: Fields;
  feedbackUpdateFields?: Fields;
  feedbackStatusValues?: string[];
  feedbackObjectFields?: Record<string, FieldCfg & { kind: "scalar" | "relation" }>;
};

function captureSchema() {
  const captured: Captured = { mutations: {} };

  const t = new Proxy({} as Record<string, (...a: unknown[]) => unknown>, {
    get: (_target, prop: string) => {
      if (prop === "exposeString") {
        return (field: string, opts: FieldCfg = {}): FieldCfg & { kind: "scalar"; field: string } => ({
          kind: "scalar",
          field,
          ...opts,
        });
      }
      if (prop === "expose") {
        return (field: string, opts: FieldCfg = {}): FieldCfg & { kind: "scalar"; field: string } => ({
          kind: "scalar",
          field,
          ...opts,
        });
      }
      if (prop === "relation") {
        return (field: string, opts: FieldCfg = {}): FieldCfg & { kind: "relation"; field: string } => ({
          kind: "relation",
          field,
          ...opts,
        });
      }
      if (prop === "prismaField" || prop === "field") {
        return (opts: unknown) => opts;
      }
      if (prop === "arg") {
        return (opts: unknown) => opts;
      }
      return () => prop;
    },
  });

  const builder = {
    DateTime: "DateTime",
    prismaCreate: jest.fn((_name: string, cfg: { fields: Fields }) => {
      captured.feedbackCreateFields = cfg.fields;
      return "FeedbackCreate";
    }),
    prismaUpdate: jest.fn((_name: string, cfg: { fields: Fields }) => {
      captured.feedbackUpdateFields = cfg.fields;
      return "FeedbackUpdate";
    }),
    prismaUpdateRelation: jest.fn(() => "FeedbackUpdateRelation"),
    prismaWhereUnique: jest.fn(() => "FeedbackWhereUnique"),
    prismaWhere: jest.fn(() => "FeedbackWhere"),
    prismaOrderBy: jest.fn(() => "FeedbackOrderBy"),
    prismaFilter: jest.fn(() => "FeedbackStatusFilter"),
    prismaObject: jest.fn(
      (_name: string, cfg: { fields: (tt: unknown) => Record<string, FieldCfg & { kind: string }> }) => {
        captured.feedbackObjectFields = cfg.fields(t) as Record<string, FieldCfg & { kind: "scalar" | "relation" }>;
        return {};
      },
    ),
    enumType: jest.fn((name: string, cfg: { values: unknown }) => {
      if (name === "FeedbackStatus") captured.feedbackStatusValues = cfg.values as string[];
      return name;
    }),
    inputType: jest.fn((name: string) => name),
    addScalarType: jest.fn((name: string) => name),
    mutationField: jest.fn((name: string, cb: (tt: unknown) => unknown) => {
      const opts = cb(t) as {
        authScopes?: Record<string, boolean>;
        args: Record<string, { type: unknown; required?: boolean }>;
      };
      captured.mutations[name] = { authScopes: opts.authScopes, args: opts.args };
    }),
    queryField: jest.fn(),
  } as unknown as SchemaBuilderService;

  return { builder, captured };
}

function buildFeedbackSchema(builder: SchemaBuilderService) {
  const feedbackObject = new FeedbackObject(builder);
  const feedbackQuery = new FeedbackQuery(builder, {} as PrismaService, feedbackObject, {
    UserWhereUnique: "UserWhereUnique",
  } as unknown as import("../user/query.service").UserQuery);
  const fileQuery = { FileWhereUnique: "FileWhereUnique" } as unknown as FileQuery;
  new FeedbackMutation(
    builder,
    {} as PrismaService,
    { publish: jest.fn() } as unknown as SubscriptionService,
    feedbackObject,
    feedbackQuery,
    fileQuery,
  );
}

// scenario: feedback-workflow
describe("Feedback workflow: statuses, admin-only changes, null assignee", () => {
  describe("the FeedbackStatus enum", () => {
    it("exposes exactly Todo, InProgress and Done", () => {
      const { builder, captured } = captureSchema();
      buildFeedbackSchema(builder);
      expect(captured.feedbackStatusValues).toBeDefined();
      const values = (captured.feedbackStatusValues ?? []).slice().sort();
      expect(values).toEqual(["Done", "InProgress", "Todo"]);
    });

    it("mirrors the Prisma FeedbackStatus enum (no drift)", () => {
      expect(Object.values(FeedbackStatus).slice().sort()).toEqual(["Done", "InProgress", "Todo"]);
    });
  });

  describe("createFeedback", () => {
    it("is open to any signed-in user (not admin-only)", () => {
      const { builder, captured } = captureSchema();
      buildFeedbackSchema(builder);
      const create = captured.mutations["createFeedback"];
      expect(create).toBeDefined();
      expect(create.authScopes).toEqual({ user: true });
    });

    it("does not accept status or assigneeId on create (FeedbackCreate shape)", () => {
      const { builder, captured } = captureSchema();
      buildFeedbackSchema(builder);
      const fields = captured.feedbackCreateFields ?? {};
      expect(Object.keys(fields)).not.toContain("status");
      expect(Object.keys(fields)).not.toContain("assigneeId");
    });
  });

  describe("updateFeedback", () => {
    it("requires admin (negative control: not merely user)", () => {
      const { builder, captured } = captureSchema();
      buildFeedbackSchema(builder);
      const update = captured.mutations["updateFeedback"];
      expect(update).toBeDefined();
      expect(update.authScopes).toEqual({ admin: true });
      expect(update.authScopes).not.toEqual({ user: true });
    });

    it("exposes exactly status and assigneeId (nothing else is mutable)", () => {
      const { builder, captured } = captureSchema();
      buildFeedbackSchema(builder);
      const fields = captured.feedbackUpdateFields ?? {};
      expect(Object.keys(fields).sort()).toEqual(["assigneeId", "status"]);
    });

    it("does not expose message, userId, createdAt or files on FeedbackUpdate", () => {
      const { builder, captured } = captureSchema();
      buildFeedbackSchema(builder);
      const keys = Object.keys(captured.feedbackUpdateFields ?? {});
      for (const forbidden of ["message", "userId", "createdAt", "updatedAt", "files"]) {
        expect(keys).not.toContain(forbidden);
      }
    });
  });

  describe("deleteFeedback", () => {
    it("requires admin", () => {
      const { builder, captured } = captureSchema();
      buildFeedbackSchema(builder);
      const del = captured.mutations["deleteFeedback"];
      expect(del).toBeDefined();
      expect(del.authScopes).toEqual({ admin: true });
    });
  });

  describe("Feedback object: unassigned reads with a null assignee", () => {
    it("exposes assigneeId as a Prisma field (inherits DB nullability)", () => {
      const { builder, captured } = captureSchema();
      buildFeedbackSchema(builder);
      const assigneeId = captured.feedbackObjectFields?.["assigneeId"];
      expect(assigneeId).toBeDefined();
      expect(assigneeId?.kind).toBe("scalar");
      expect(assigneeId?.nullable).not.toBe(false);
    });

    it("exposes assignee as a Prisma relation (inherits DB nullability)", () => {
      const { builder, captured } = captureSchema();
      buildFeedbackSchema(builder);
      const assignee = captured.feedbackObjectFields?.["assignee"];
      expect(assignee).toBeDefined();
      expect(assignee?.kind).toBe("relation");
      expect(assignee?.nullable).not.toBe(false);
    });
  });
});
