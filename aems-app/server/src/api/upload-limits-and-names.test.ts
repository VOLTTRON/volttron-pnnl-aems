jest.mock("node:fs/promises", () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("node:fs", () => ({
  ...jest.requireActual("node:fs"),
  existsSync: jest.fn().mockReturnValue(true),
}));

jest.mock("@/utils/file", () => ({
  getObjectKey: jest.fn(({ name }: { name: string }) => `hashed-${name}`),
}));

import { writeFile } from "node:fs/promises";
import {
  FileController,
  MAX_UPLOAD_FILES,
  MAX_UPLOAD_SIZE,
  describeUploadError,
  UploadFailure,
} from "./file.controller";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
import { Test, TestingModule } from "@nestjs/testing";
import { Response } from "express";

const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;

function makeConfig(): AppConfigService {
  return { file: { uploadPath: "/tmp/uploads" } } as unknown as AppConfigService;
}

function makePrisma(fileRecord: unknown = { id: "f1", objectKey: "hashed-x.pdf", mimeType: "application/pdf" }): PrismaService {
  return {
    prisma: {
      file: {
        create: jest.fn().mockResolvedValue(fileRecord),
        delete: jest.fn().mockResolvedValue(undefined),
        findFirst: jest.fn().mockResolvedValue(fileRecord),
      },
    },
  } as unknown as PrismaService;
}

function makeFile(name: string, mimeType: string, size = 12): Express.Multer.File {
  return {
    originalname: name,
    mimetype: mimeType,
    buffer: Buffer.alloc(size, "a"),
    size,
    fieldname: "files",
    encoding: "7bit",
    stream: null as any,
    destination: "",
    filename: name,
    path: "",
  };
}

function makeRes(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    sendFile: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function makeUser(): Express.User {
  return { id: "u1" } as any;
}

// scenario: upload-limits-and-names
describe("Upload: limits, allowed types, server-chosen names, reasoned failures, successes stay", () => {
  let module: TestingModule;
  let controller: FileController;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = makePrisma();
    module = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: AppConfigService.Key, useValue: makeConfig() },
      ],
    }).compile();
    controller = module.get<FileController>(FileController);
  });

  afterEach(async () => {
    await module.close();
  });

  it("exposes the limits the multer interceptor is configured against", () => {
    expect(MAX_UPLOAD_FILES).toBe(10);
    expect(MAX_UPLOAD_SIZE).toBe(50 * 1024 * 1024);
  });

  it("uses a server-chosen name (getObjectKey) rather than the original one", async () => {
    const res = makeRes();
    await controller.upload(makeUser(), res, [makeFile("report.pdf", "application/pdf")]);

    const writeCall = mockWriteFile.mock.calls[0];
    const writePath = writeCall[0] as string;
    expect(writePath).toContain("hashed-report.pdf");
    expect(writePath).not.toMatch(/\\report\.pdf$|\/report\.pdf$/);
  });

  describe("reasoned failure reporting", () => {
    it("a disallowed mimetype is reported by name with a reason, never stored", async () => {
      const res = makeRes();
      await controller.upload(makeUser(), res, [makeFile("evil.exe", "application/x-msdownload")]);

      const body = (res.json as jest.Mock).mock.calls[0][0] as { ids: string[]; failed?: UploadFailure[] };
      expect(body.ids).toHaveLength(0);
      expect(body.failed).toBeDefined();
      expect(body.failed![0].name).toBe("evil.exe");
      expect(body.failed![0].reason).toMatch(/disallowed type/i);
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it("a file exceeding MAX_UPLOAD_SIZE is reported with a size reason, never written", async () => {
      const res = makeRes();
      // Build a file whose buffer length is already past the limit (multer limits
      // the stream too, but the per-handler guard is what the claim pins down).
      const huge = makeFile("huge.pdf", "application/pdf", MAX_UPLOAD_SIZE + 1);
      await controller.upload(makeUser(), res, [huge]);

      const body = (res.json as jest.Mock).mock.calls[0][0] as { ids: string[]; failed?: UploadFailure[] };
      expect(body.failed?.[0].name).toBe("huge.pdf");
      expect(body.failed?.[0].reason).toMatch(/exceeds/i);
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it("a store failure is reported with the error message", async () => {
      mockWriteFile.mockRejectedValueOnce(new Error("ENOSPC"));
      const res = makeRes();
      await controller.upload(makeUser(), res, [makeFile("fail.pdf", "application/pdf")]);

      const body = (res.json as jest.Mock).mock.calls[0][0] as { ids: string[]; failed?: UploadFailure[] };
      expect(body.failed?.[0]).toEqual(expect.objectContaining({ name: "fail.pdf" }));
      expect(body.failed?.[0].reason).toContain("ENOSPC");
    });
  });

  describe("partial success: successes stay, exactly those returned", () => {
    it("one succeeds and one fails — the success is returned, nothing is cleaned up", async () => {
      mockWriteFile
        .mockResolvedValueOnce(undefined) // ok.pdf
        .mockRejectedValueOnce(new Error("disk full")); // fail.pdf
      (prisma.prisma.file.create as jest.Mock)
        .mockResolvedValueOnce({ id: "ok1", objectKey: "hashed-ok.pdf", mimeType: "application/pdf" });

      const res = makeRes();
      await controller.upload(makeUser(), res, [
        makeFile("ok.pdf", "application/pdf"),
        makeFile("fail.pdf", "application/pdf"),
      ]);

      const body = (res.json as jest.Mock).mock.calls[0][0] as { ids: string[]; failed?: UploadFailure[] };
      expect(body.ids).toEqual(["ok1"]);
      expect(body.failed?.[0]).toEqual(expect.objectContaining({ name: "fail.pdf" }));
      // No per-file-failure cleanup: the success is not deleted.
      expect(prisma.prisma.file.delete).not.toHaveBeenCalled();
    });
  });

  describe("describeUploadError helper", () => {
    const { PrismaClientKnownRequestError } = jest.requireActual<typeof import("@prisma/client/runtime/library")>(
      "@prisma/client/runtime/library",
    );

    it("maps P2002 to a human message", () => {
      const e = new PrismaClientKnownRequestError("x", { code: "P2002", clientVersion: "5.0.0" });
      expect(describeUploadError(e)).toMatch(/already exists/i);
    });

    it("maps P2003 to a human message", () => {
      const e = new PrismaClientKnownRequestError("x", { code: "P2003", clientVersion: "5.0.0" });
      expect(describeUploadError(e)).toMatch(/user does not exist/i);
    });

    it("passes through the Error message for a generic error", () => {
      expect(describeUploadError(new Error("boom"))).toBe("boom");
    });

    it("stringifies non-Error values", () => {
      expect(describeUploadError("plain")).toBe("plain");
    });
  });
});
