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

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { FileController } from "./file.controller";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
import { Test, TestingModule } from "@nestjs/testing";
import { Response } from "express";

const mockMkdir = mkdir as jest.MockedFunction<typeof mkdir>;
const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

function makeConfig(): AppConfigService {
  return {
    file: { uploadPath: "/tmp/uploads" },
  } as unknown as AppConfigService;
}

function makePrisma(fileRecord: unknown = { id: "f1", objectKey: "hashed-test.txt", mimeType: "text/plain" }): PrismaService {
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

function makeFile(name = "test.txt", mimeType = "text/plain"): Express.Multer.File {
  return {
    originalname: name,
    mimetype: mimeType,
    buffer: Buffer.from("file content"),
    size: 12,
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
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    sendFile: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function makeUser(): Express.User {
  return { id: "u1" } as any;
}

describe("FileController.upload", () => {
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

  it("returns 400 when no files are uploaded", async () => {
    const res = makeRes();
    await controller.upload(makeUser(), res, []);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("writes file to disk and creates DB record on success", async () => {
    const res = makeRes();
    const files = [makeFile("doc.pdf", "application/pdf")];

    await controller.upload(makeUser(), res, files);

    expect(mockWriteFile).toHaveBeenCalled();
    expect(prisma.prisma.file.create).toHaveBeenCalled();
    const jsonArg = (res.json as jest.Mock).mock.calls[0][0] as { success: boolean; ids: string[] };
    expect(jsonArg.success).toBe(true);
    expect(jsonArg.ids).toHaveLength(1);
  });

  it("creates the upload directory if it does not exist", async () => {
    mockExistsSync.mockReturnValueOnce(false);
    const res = makeRes();

    await controller.upload(makeUser(), res, [makeFile()]);

    expect(mockMkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });

  it("returns 500 when mkdir fails", async () => {
    mockExistsSync.mockReturnValueOnce(false);
    mockMkdir.mockRejectedValueOnce(new Error("permission denied"));
    const res = makeRes();

    await controller.upload(makeUser(), res, [makeFile()]);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("includes failed filenames in the response and triggers cleanup", async () => {
    mockWriteFile.mockRejectedValueOnce(new Error("disk full"));
    const res = makeRes();

    await controller.upload(makeUser(), res, [makeFile("fail.txt")]);

    const jsonArg = (res.json as jest.Mock).mock.calls[0][0] as { failed: string[] };
    expect(jsonArg.failed).toBeDefined();
    expect(jsonArg.failed).toContain("fail.txt");
  });

  it("reports partial success when some files succeed and some fail", async () => {
    mockWriteFile
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("disk full"));

    const res = makeRes();
    await controller.upload(makeUser(), res, [makeFile("ok.txt"), makeFile("fail.txt")]);

    const jsonArg = (res.json as jest.Mock).mock.calls[0][0] as { ids: string[]; failed: string[] };
    expect(jsonArg.ids).toHaveLength(1);
    expect(jsonArg.failed).toHaveLength(1);
  });
});

describe("FileController.download", () => {
  let module: TestingModule;
  let controller: FileController;

  beforeEach(async () => {
    jest.clearAllMocks();
    module = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        { provide: PrismaService, useValue: makePrisma() },
        { provide: AppConfigService.Key, useValue: makeConfig() },
      ],
    }).compile();

    controller = module.get<FileController>(FileController);
  });

  afterEach(async () => {
    await module.close();
  });

  it("returns 404 when file record is not found", async () => {
    const prisma = makePrisma(null);
    const localModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: AppConfigService.Key, useValue: makeConfig() },
      ],
    }).compile();
    const localController = localModule.get<FileController>(FileController);

    const res = makeRes();
    await localController.download(res, "nonexistent-id", "file.txt");

    expect(res.status).toHaveBeenCalledWith(404);
    await localModule.close();
  });

  it("sends the file with correct headers when record exists", async () => {
    const res = makeRes();
    await controller.download(res, "f1", "doc.pdf");

    expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", expect.stringContaining("doc.pdf"));
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/plain");
    expect(res.sendFile).toHaveBeenCalled();
  });
});

describe("cleanupPartialUploads (via failed upload path)", () => {
  it("calls prisma.file.delete when cleanup runs after partial failure", async () => {
    const prisma = makePrisma({ id: "f1", objectKey: "hashed-file.txt", mimeType: "text/plain" });

    // First write succeeds (creates DB record), second write fails (triggers cleanup)
    mockWriteFile
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("fail"));

    const module = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: AppConfigService.Key, useValue: makeConfig() },
      ],
    }).compile();

    const controller = module.get<FileController>(FileController);
    const res = makeRes();

    await controller.upload(makeUser(), res, [makeFile("a.txt"), makeFile("b.txt")]);

    // Give cleanup a tick to run (it's fire-and-forget)
    await new Promise((r) => setTimeout(r, 0));
    expect(prisma.prisma.file.delete).toHaveBeenCalled();

    await module.close();
  });
});
