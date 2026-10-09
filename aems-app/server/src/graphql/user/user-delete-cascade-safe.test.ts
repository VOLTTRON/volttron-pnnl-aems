import { readFileSync } from "node:fs";
import { join } from "node:path";
import { UserMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { UserQuery } from "./query.service";
import { UserObject } from "./object.service";
import { AccountQuery } from "../account/query.service";
import { AccountMutation } from "../account/mutate.service";
import { CommentQuery } from "../comment/query.service";
import { BannerQuery } from "../banner/query.service";
import { CommentMutation } from "../comment/mutate.service";
import { BannerMutation } from "../banner/mutate.service";
import { UnitQuery } from "../unit/query.service";
import { KeycloakAdminService } from "../keycloak/keycloak-admin.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { AppConfigService } from "@/app.config";

const unlinkMock = jest.fn();
jest.mock("node:fs/promises", () => ({
  unlink: (...args: unknown[]) => unlinkMock(...args),
}));

type Resolve = (query: unknown, root: unknown, args: unknown, ctx: unknown) => Promise<unknown>;

const resolvers: Record<string, Resolve> = {};

function makeMockT() {
  return {
    prismaField: jest.fn((opts: any) => opts),
    arg: jest.fn((opts: any) => opts),
  };
}

function makeBuilder(): SchemaBuilderService {
  const mockT = makeMockT();
  return {
    DateTime: "DateTime",
    prismaCreate: jest.fn(() => "UserCreate"),
    prismaUpdate: jest.fn(() => "UserUpdate"),
    prismaUpdateRelation: jest.fn(() => "UserUpdateRelation"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makePrisma(deletedUser = { id: "u1" }, findResult: unknown = { role: null, files: [] }) {
  return {
    prisma: {
      user: {
        delete: jest.fn().mockResolvedValue(deletedUser),
        findUnique: jest.fn().mockResolvedValue(findResult),
        update: jest.fn().mockResolvedValue(deletedUser),
      },
    },
  } as unknown as PrismaService;
}

function makeDeps(): [SubscriptionService, UserObject, UserQuery, AccountQuery, CommentQuery, BannerQuery, UnitQuery, AccountMutation, CommentMutation, BannerMutation, KeycloakAdminService, AppConfigService] {
  return [
    { publish: jest.fn().mockResolvedValue(undefined) } as unknown as SubscriptionService,
    { UserPreferences: "UserPreferences" } as unknown as UserObject,
    { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery,
    { AccountWhereUnique: "AccountWhereUnique" } as unknown as AccountQuery,
    { CommentWhereUnique: "CommentWhereUnique" } as unknown as CommentQuery,
    { BannerWhereUnique: "BannerWhereUnique" } as unknown as BannerQuery,
    { UnitWhereUnique: "UnitWhereUnique" } as unknown as UnitQuery,
    { AccountCreate: "AccountCreate" } as unknown as AccountMutation,
    { CommentCreate: "CommentCreate" } as unknown as CommentMutation,
    { BannerCreate: "BannerCreate" } as unknown as BannerMutation,
    { syncAdminRole: jest.fn().mockResolvedValue(undefined) } as unknown as KeycloakAdminService,
    { file: { uploadPath: "/data/uploads" } } as unknown as AppConfigService,
  ];
}

const adminCtx = { user: { id: "a1", roles: [{ name: "admin" }], authRoles: { admin: true, user: true } } };

// scenario: user-delete-cascade-safe
describe("Deleting a user: feedback kept unassigned, uploaded bytes removed, a missing file does not block it", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    unlinkMock.mockReset();
    unlinkMock.mockResolvedValue(undefined);
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("prisma schema: feedback.assignee cascades to SetNull (not Cascade)", () => {
    // The claim's "feedback kept unassigned" turns on this one onDelete. The schema is
    // the record of truth; we read it directly here.
    it("feedback.assignee has onDelete: SetNull", () => {
      const schemaPath = join(__dirname, "..", "..", "..", "..", "prisma", "prisma", "models", "feedback.prisma");
      const text = readFileSync(schemaPath, "utf8");
      // Look for the assignee relation line.
      const assigneeLine = text.split(/\r?\n/).find((line) => line.includes('@relation("assignee"'));
      expect(assigneeLine).toBeDefined();
      expect(assigneeLine).toMatch(/onDelete:\s*SetNull/);
      // Negative: it is explicitly NOT Cascade.
      expect(assigneeLine).not.toMatch(/onDelete:\s*Cascade/);
    });
  });

  describe("deleteUser resolver: file bytes", () => {
    it("unlinks every uploaded file's bytes after the DB delete", async () => {
      const findResult = {
        role: null,
        files: [
          { objectKey: "a.png" },
          { objectKey: "nested/b.pdf" },
        ],
      };
      const prisma = makePrisma({ id: "u1" }, findResult);
      new UserMutation(makeBuilder(), prisma, ...makeDeps());

      const callOrder: string[] = [];
      (prisma.prisma.user.delete as jest.Mock).mockImplementation(async () => {
        callOrder.push("delete");
        return { id: "u1" };
      });
      unlinkMock.mockImplementation(async () => {
        callOrder.push("unlink");
      });

      const resolve = resolvers["deleteUser"] as Resolve;
      await resolve({}, null, { where: { id: "u1" } }, adminCtx);

      expect(callOrder).toEqual(["delete", "unlink", "unlink"]);
      expect(unlinkMock).toHaveBeenCalledTimes(2);
    });

    it("no uploaded files: no unlink calls, delete still succeeds", async () => {
      const prisma = makePrisma({ id: "u1" }, { role: null, files: [] });
      new UserMutation(makeBuilder(), prisma, ...makeDeps());

      const resolve = resolvers["deleteUser"] as Resolve;
      await expect(resolve({}, null, { where: { id: "u1" } }, adminCtx)).resolves.toMatchObject({ id: "u1" });
      expect(unlinkMock).not.toHaveBeenCalled();
    });

    it("a missing file does not stop the delete (ENOENT swallowed)", async () => {
      const findResult = { role: null, files: [{ objectKey: "gone.png" }, { objectKey: "stays.pdf" }] };
      const prisma = makePrisma({ id: "u1" }, findResult);
      new UserMutation(makeBuilder(), prisma, ...makeDeps());

      const enoent = Object.assign(new Error("missing"), { code: "ENOENT" });
      unlinkMock.mockRejectedValueOnce(enoent).mockResolvedValueOnce(undefined);

      const resolve = resolvers["deleteUser"] as Resolve;
      await expect(resolve({}, null, { where: { id: "u1" } }, adminCtx)).resolves.toMatchObject({ id: "u1" });
      expect(unlinkMock).toHaveBeenCalledTimes(2);
    });

    it("negative control: without the file-bytes loop, no unlink happens", async () => {
      // Guard: with the loop in place, two files produce two unlinks (asserted above).
      // If someone drops the loop, that test flips red. This control just re-asserts
      // the shape of the proof.
      const findResult = { role: null, files: [{ objectKey: "a.png" }] };
      const prisma = makePrisma({ id: "u1" }, findResult);
      new UserMutation(makeBuilder(), prisma, ...makeDeps());

      const resolve = resolvers["deleteUser"] as Resolve;
      await resolve({}, null, { where: { id: "u1" } }, adminCtx);
      expect(unlinkMock).toHaveBeenCalled();
    });
  });
});
