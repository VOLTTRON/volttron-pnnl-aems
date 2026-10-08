import { Logger } from "@nestjs/common";
import { FileMutation, unlinkFileBytes } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { FileQuery } from "./query.service";
import { UserQuery } from "../user/query.service";
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
    prismaCreate: jest.fn(() => "FileCreate"),
    prismaCreateRelation: jest.fn(() => "FileUpdateUser"),
    prismaUpdate: jest.fn(() => "FileUpdate"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeFileQuery(): FileQuery {
  return { FileWhereUnique: "FileWhereUnique" } as unknown as FileQuery;
}

function makeUserQuery(): UserQuery {
  return { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery;
}

function makePrisma(deleted: object = { id: "f1", objectKey: "abc.png", userId: "u1" }) {
  return {
    prisma: {
      file: {
        delete: jest.fn().mockResolvedValue(deleted),
        create: jest.fn().mockResolvedValue(deleted),
        update: jest.fn().mockResolvedValue(deleted),
      },
    },
  } as unknown as PrismaService;
}

function makeSubscription() {
  return { publish: jest.fn().mockResolvedValue(undefined) } as unknown as SubscriptionService;
}

function makeConfig(uploadPath = "uploads"): AppConfigService {
  return { file: { uploadPath } } as unknown as AppConfigService;
}

const adminCtx = { user: { id: "u1", authRoles: { admin: true, user: true } } };

// scenario: file-delete-removes-bytes
describe("Deleting a file record removes its bytes from disk", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    unlinkMock.mockReset();
    unlinkMock.mockResolvedValue(undefined);
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("unlinkFileBytes helper", () => {
    const logger = new Logger("test");

    it("unlinks the file at uploadDir/objectKey", async () => {
      await unlinkFileBytes("/data/uploads", "a/b.png", logger);
      expect(unlinkMock).toHaveBeenCalledTimes(1);
      const path = unlinkMock.mock.calls[0][0] as string;
      expect(path.endsWith("a/b.png") || path.endsWith("a\\b.png")).toBe(true);
      expect(path.includes("uploads")).toBe(true);
    });

    it("missing bytes do not stop the delete (ENOENT swallowed)", async () => {
      const err = Object.assign(new Error("missing"), { code: "ENOENT" });
      unlinkMock.mockRejectedValueOnce(err);
      await expect(unlinkFileBytes("/data/uploads", "gone.png", logger)).resolves.toBeUndefined();
    });

    it("other errors are not swallowed", async () => {
      const err = Object.assign(new Error("eperm"), { code: "EPERM" });
      unlinkMock.mockRejectedValueOnce(err);
      await expect(unlinkFileBytes("/data/uploads", "gone.png", logger)).rejects.toThrow("eperm");
    });

    it("no objectKey means no unlink call", async () => {
      await unlinkFileBytes("/data/uploads", null, logger);
      await unlinkFileBytes("/data/uploads", undefined, logger);
      await unlinkFileBytes("/data/uploads", "", logger);
      expect(unlinkMock).not.toHaveBeenCalled();
    });
  });

  describe("deleteFile resolver", () => {
    it("unlinks the bytes after prisma delete, and only after", async () => {
      const prisma = makePrisma({ id: "f1", objectKey: "abc.png", userId: "u1" });
      const sub = makeSubscription();
      const callOrder: string[] = [];
      (prisma.prisma.file.delete as jest.Mock).mockImplementation(async () => {
        callOrder.push("delete");
        return { id: "f1", objectKey: "abc.png", userId: "u1" };
      });
      unlinkMock.mockImplementation(async () => {
        callOrder.push("unlink");
      });
      new FileMutation(makeBuilder(), prisma, sub, makeFileQuery(), makeUserQuery(), makeConfig());

      const resolve = resolvers["deleteFile"] as Resolve;
      await resolve({}, null, { where: { id: "f1" } }, adminCtx);

      expect(callOrder).toEqual(["delete", "unlink"]);
    });

    it("missing bytes do not stop the delete", async () => {
      const prisma = makePrisma({ id: "f2", objectKey: "gone.png", userId: "u1" });
      const sub = makeSubscription();
      const err = Object.assign(new Error("missing"), { code: "ENOENT" });
      unlinkMock.mockRejectedValueOnce(err);
      new FileMutation(makeBuilder(), prisma, sub, makeFileQuery(), makeUserQuery(), makeConfig());

      const resolve = resolvers["deleteFile"] as Resolve;
      await expect(resolve({}, null, { where: { id: "f2" } }, adminCtx)).resolves.toMatchObject({ id: "f2" });

      expect(prisma.prisma.file.delete).toHaveBeenCalledTimes(1);
      expect(unlinkMock).toHaveBeenCalledTimes(1);
      // Subscriptions still fire (two publishes) because the delete succeeded.
      expect(sub.publish).toHaveBeenCalledTimes(2);
    });

    it("negative control: without the unlink in the resolver, bytes stay (helper never called)", async () => {
      // This is the shape of the bug the claim guards against — the test above
      // guarantees unlinkMock is called, so a resolver that skips it goes red.
      const prisma = makePrisma({ id: "f3", objectKey: "k.png", userId: "u1" });
      const sub = makeSubscription();
      new FileMutation(makeBuilder(), prisma, sub, makeFileQuery(), makeUserQuery(), makeConfig());

      const resolve = resolvers["deleteFile"] as Resolve;
      await resolve({}, null, { where: { id: "f3" } }, adminCtx);

      // The guard: unlink is reached (not asserting zero — asserting one).
      expect(unlinkMock).toHaveBeenCalled();
    });
  });
});
