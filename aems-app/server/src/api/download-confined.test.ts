jest.mock("node:fs/promises", () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("node:fs", () => ({
  ...jest.requireActual("node:fs"),
  existsSync: jest.fn().mockReturnValue(true),
}));

import { FileController, isPathInside, sanitizeFilename } from "./file.controller";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
import { Test, TestingModule } from "@nestjs/testing";
import { Response } from "express";
import { FileMutation } from "@/graphql/file/mutate.service";
import { SchemaBuilderService } from "@/graphql/builder.service";
import { FileQuery } from "@/graphql/file/query.service";
import { UserQuery } from "@/graphql/user/query.service";
import { SubscriptionService } from "@/subscription/subscription.service";

function makeConfig(uploadPath = "/tmp/uploads"): AppConfigService {
  return { file: { uploadPath } } as unknown as AppConfigService;
}

function makePrisma(fileRecord: unknown): PrismaService {
  return {
    prisma: {
      file: {
        findFirst: jest.fn().mockResolvedValue(fileRecord),
      },
    },
  } as unknown as PrismaService;
}

function makeRes(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    sendFile: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

// scenario: download-confined
describe("download: path confined to uploadDir; filename quoted and sanitized; no input sets objectKey", () => {
  describe("isPathInside helper", () => {
    it("recognises a child under parent", () => {
      expect(isPathInside("/data/uploads/abc.png", "/data/uploads")).toBe(true);
      expect(isPathInside("/data/uploads/sub/abc.png", "/data/uploads")).toBe(true);
      expect(isPathInside("/data/uploads", "/data/uploads")).toBe(true);
    });

    it("refuses a path that escapes with ..", () => {
      // The caller must pass the already-resolved path. These are post-resolve paths.
      expect(isPathInside("/data/etc/passwd", "/data/uploads")).toBe(false);
      expect(isPathInside("/etc/passwd", "/data/uploads")).toBe(false);
    });

    it("refuses a sibling that shares a prefix", () => {
      expect(isPathInside("/data/uploads-other/x", "/data/uploads")).toBe(false);
    });

    it("works for windows-style separators", () => {
      expect(isPathInside("C:\\data\\uploads\\x.png", "C:\\data\\uploads")).toBe(true);
      expect(isPathInside("C:\\data\\other\\x.png", "C:\\data\\uploads")).toBe(false);
    });
  });

  describe("sanitizeFilename helper", () => {
    it("drops CR, LF, quote, backslash, slash and NUL", () => {
      expect(sanitizeFilename('ok"name.pdf')).toBe("okname.pdf");
      expect(sanitizeFilename("line1\r\nline2.pdf")).toBe("line1line2.pdf");
      expect(sanitizeFilename("a\\b/c.pdf")).toBe("abc.pdf");
      expect(sanitizeFilename("a\0b.pdf")).toBe("ab.pdf");
    });

    it("falls back to 'download' when nothing is left", () => {
      expect(sanitizeFilename("")).toBe("download");
      expect(sanitizeFilename("\r\n")).toBe("download");
    });

    it("passes typical names through", () => {
      expect(sanitizeFilename("report-2026.pdf")).toBe("report-2026.pdf");
    });
  });

  describe("FileController.download: confinement", () => {
    let module: TestingModule;

    afterEach(async () => {
      if (module) await module.close();
    });

    async function build(fileRecord: unknown, uploadPath = "/tmp/uploads") {
      module = await Test.createTestingModule({
        controllers: [FileController],
        providers: [
          { provide: PrismaService, useValue: makePrisma(fileRecord) },
          { provide: AppConfigService.Key, useValue: makeConfig(uploadPath) },
        ],
      }).compile();
      return module.get<FileController>(FileController);
    }

    it("a resolved path that stays inside uploadDir is served", async () => {
      const controller = await build({ objectKey: "abc.png", mimeType: "image/png" });
      const res = makeRes();
      await controller.download(res, "f1", "abc.png");
      expect(res.sendFile).toHaveBeenCalledTimes(1);
    });

    it("a resolved path that escapes uploadDir is refused with 404 and never served", async () => {
      // objectKey with .. that resolves above uploadDir
      const controller = await build({ objectKey: "../../etc/passwd", mimeType: "text/plain" });
      const res = makeRes();
      await controller.download(res, "f1", "passwd");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.sendFile).not.toHaveBeenCalled();
    });

    it("Content-Disposition is quoted and the filename is sanitized", async () => {
      const controller = await build({ objectKey: "doc.pdf", mimeType: "application/pdf" });
      const res = makeRes();
      // name contains a quote and CRLF — the response must not propagate them.
      await controller.download(res, "f1", 'evil"\r\nX-Evil: 1.pdf');
      const call = (res.setHeader as jest.Mock).mock.calls.find((c) => c[0] === "Content-Disposition");
      expect(call).toBeDefined();
      const value = call![1] as string;
      // Must be quoted.
      expect(value).toMatch(/^attachment; filename=".*"$/);
      // Must not contain CR, LF, quote or backslash in the filename body.
      const inner = value.replace(/^attachment; filename="/, "").replace(/"$/, "");
      expect(inner).not.toMatch(/[\r\n"\\]/);
    });
  });

  describe("GraphQL file inputs: no path accepts objectKey", () => {
    type Captured = { createFields?: Record<string, unknown>; updateFields?: Record<string, unknown> };

    function capture(): { builder: SchemaBuilderService; captured: Captured } {
      const captured: Captured = {};
      const builder = {
        prismaCreate: jest.fn((_name: string, cfg: { fields: Record<string, unknown> }) => {
          captured.createFields = cfg.fields;
          return "FileCreate";
        }),
        prismaUpdate: jest.fn((_name: string, cfg: { fields: Record<string, unknown> }) => {
          captured.updateFields = cfg.fields;
          return "FileUpdate";
        }),
        prismaCreateRelation: jest.fn(() => "FileUpdateUser"),
        mutationField: jest.fn(),
      } as unknown as SchemaBuilderService;
      return { builder, captured };
    }

    it("FileCreate exposes no objectKey field", () => {
      const { builder, captured } = capture();
      new FileMutation(
        builder,
        { prisma: {} } as unknown as PrismaService,
        { publish: jest.fn() } as unknown as SubscriptionService,
        { FileWhereUnique: "FileWhereUnique" } as unknown as FileQuery,
        { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery,
        makeConfig(),
      );
      expect(captured.createFields).toBeDefined();
      expect(Object.keys(captured.createFields!)).not.toContain("objectKey");
    });

    it("FileUpdate exposes no objectKey field", () => {
      const { builder, captured } = capture();
      new FileMutation(
        builder,
        { prisma: {} } as unknown as PrismaService,
        { publish: jest.fn() } as unknown as SubscriptionService,
        { FileWhereUnique: "FileWhereUnique" } as unknown as FileQuery,
        { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery,
        makeConfig(),
      );
      expect(captured.updateFields).toBeDefined();
      expect(Object.keys(captured.updateFields!)).not.toContain("objectKey");
    });

    it("negative control: FileCreate must still expose mimeType and contentLength", () => {
      // If this flipped (missing both), FileCreate would be empty and the test above would
      // trivially pass — so this asserts the inputs still carry what they should.
      const { builder, captured } = capture();
      new FileMutation(
        builder,
        { prisma: {} } as unknown as PrismaService,
        { publish: jest.fn() } as unknown as SubscriptionService,
        { FileWhereUnique: "FileWhereUnique" } as unknown as FileQuery,
        { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery,
        makeConfig(),
      );
      const keys = Object.keys(captured.createFields!);
      expect(keys).toContain("mimeType");
      expect(keys).toContain("contentLength");
    });
  });
});
