/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import { BackupArchiveService } from "./backup-archive.service";
import { PrismaService } from "@/prisma/prisma.service";
import { BackupSubscriptionPublisher } from "./backup-publisher.service";
import { BackupDestinationType } from "@prisma/client";
import { access, unlink } from "fs/promises";

jest.mock("fs/promises");
const fsAccess = access as jest.MockedFunction<typeof access>;
const fsUnlink = unlink as jest.MockedFunction<typeof unlink>;

const sendMock = jest.fn();
interface S3CommandInput {
  Bucket: string;
  Key: string;
}
jest.mock("@aws-sdk/client-s3", () => {
  class NotFound extends Error {
    constructor() {
      super("NotFound");
      this.name = "NotFound";
    }
  }
  class NoSuchKey extends Error {
    constructor() {
      super("NoSuchKey");
      this.name = "NoSuchKey";
    }
  }
  return {
    S3Client: jest.fn().mockImplementation(() => ({ send: sendMock })),
    HeadObjectCommand: jest.fn().mockImplementation((input: S3CommandInput) => ({ __type: "Head", input })),
    DeleteObjectCommand: jest.fn().mockImplementation((input: S3CommandInput) => ({ __type: "Delete", input })),
    NotFound,
    NoSuchKey,
  };
});

describe("BackupArchiveService", () => {
  let service: BackupArchiveService;
  let prismaService: jest.Mocked<PrismaService>;
  let publisher: jest.Mocked<BackupSubscriptionPublisher>;
  let findUnique: jest.Mock;
  let findMany: jest.Mock;
  let findUniqueOrThrow: jest.Mock;
  let update: jest.Mock;

  const localRow = {
    id: "rd-local",
    runId: "run-1",
    finalPath: "/var/lib/backup/archives/skeleton-20260507T120000Z.tar.gz.age",
    archiveDeletedAt: null as Date | null,
    destination: { id: "dst-local", type: BackupDestinationType.Local, output: null },
  };

  const s3Row = {
    id: "rd-s3",
    runId: "run-1",
    finalPath: "/var/lib/backup/pending/skeleton-20260507T120000Z.tar.gz.age",
    archiveDeletedAt: null as Date | null,
    destination: { id: "dst-s3", type: BackupDestinationType.S3, output: "s3://my-bucket/prefix/" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    findUnique = jest.fn();
    findMany = jest.fn();
    findUniqueOrThrow = jest.fn();
    update = jest.fn().mockImplementation((args: { data: Record<string, unknown> }) => ({
      ...localRow,
      ...args.data,
    }));
    prismaService = {
      prisma: {
        backupRunDestination: { findUnique, findMany, findUniqueOrThrow, update },
      },
    } as unknown as jest.Mocked<PrismaService>;
    publisher = {
      publishRun: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<BackupSubscriptionPublisher>;

    service = new BackupArchiveService(prismaService, publisher);
  });

  describe("getAvailability", () => {
    it("returns Missing when the row is absent", async () => {
      findUnique.mockResolvedValue(null);
      await expect(service.getAvailability("nope")).resolves.toBe("Missing");
    });

    it("returns Removed when archiveDeletedAt is set, without probing the filesystem", async () => {
      findUnique.mockResolvedValue({ ...localRow, archiveDeletedAt: new Date() });
      await expect(service.getAvailability(localRow.id)).resolves.toBe("Removed");
      expect(fsAccess).not.toHaveBeenCalled();
      expect(sendMock).not.toHaveBeenCalled();
    });

    it("returns Missing when finalPath is null", async () => {
      findUnique.mockResolvedValue({ ...localRow, finalPath: null });
      await expect(service.getAvailability(localRow.id)).resolves.toBe("Missing");
      expect(fsAccess).not.toHaveBeenCalled();
    });

    it("returns Available when the local file exists", async () => {
      findUnique.mockResolvedValue(localRow);
      fsAccess.mockResolvedValue(undefined);
      await expect(service.getAvailability(localRow.id)).resolves.toBe("Available");
      expect(fsAccess).toHaveBeenCalledWith(localRow.finalPath, expect.any(Number));
    });

    it("returns Missing on ENOENT", async () => {
      findUnique.mockResolvedValue(localRow);
      fsAccess.mockRejectedValue(Object.assign(new Error("no"), { code: "ENOENT" }));
      await expect(service.getAvailability(localRow.id)).resolves.toBe("Missing");
    });

    it("returns Available when S3 HeadObject succeeds", async () => {
      findUnique.mockResolvedValue(s3Row);
      sendMock.mockResolvedValue({});
      await expect(service.getAvailability(s3Row.id)).resolves.toBe("Available");
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          __type: "Head",
          input: { Bucket: "my-bucket", Key: "prefix/skeleton-20260507T120000Z.tar.gz.age" },
        }),
      );
    });

    it("returns Missing when S3 HeadObject returns 404", async () => {
      findUnique.mockResolvedValue(s3Row);
      sendMock.mockRejectedValue(Object.assign(new Error("nf"), { $metadata: { httpStatusCode: 404 } }));
      await expect(service.getAvailability(s3Row.id)).resolves.toBe("Missing");
    });

    it("returns Missing when S3 output is not a valid s3:// URI", async () => {
      findUnique.mockResolvedValue({ ...s3Row, destination: { ...s3Row.destination, output: "garbage" } });
      await expect(service.getAvailability(s3Row.id)).resolves.toBe("Missing");
      expect(sendMock).not.toHaveBeenCalled();
    });
  });

  describe("getRunAvailability", () => {
    it("returns Missing for runs with no destinations", async () => {
      findMany.mockResolvedValue([]);
      await expect(service.getRunAvailability("run-1")).resolves.toBe("Missing");
    });

    it("returns Available when any destination still has the archive", async () => {
      findMany.mockResolvedValue([{ id: "rd-a" }, { id: "rd-b" }]);
      findUnique
        .mockResolvedValueOnce({ ...localRow, id: "rd-a", archiveDeletedAt: new Date() })
        .mockResolvedValueOnce({ ...localRow, id: "rd-b" });
      fsAccess.mockResolvedValue(undefined);
      await expect(service.getRunAvailability("run-1")).resolves.toBe("Available");
    });

    it("returns Removed when every destination was intentionally cleaned up", async () => {
      findMany.mockResolvedValue([{ id: "rd-a" }, { id: "rd-b" }]);
      findUnique
        .mockResolvedValueOnce({ ...localRow, id: "rd-a", archiveDeletedAt: new Date() })
        .mockResolvedValueOnce({ ...localRow, id: "rd-b", archiveDeletedAt: new Date() });
      await expect(service.getRunAvailability("run-1")).resolves.toBe("Removed");
    });

    it("returns Missing when a mix of Missing and Removed destinations leaves nothing available", async () => {
      findMany.mockResolvedValue([{ id: "rd-a" }, { id: "rd-b" }]);
      findUnique
        .mockResolvedValueOnce({ ...localRow, id: "rd-a", archiveDeletedAt: new Date() })
        .mockResolvedValueOnce({ ...localRow, id: "rd-b" });
      fsAccess.mockRejectedValue(Object.assign(new Error("no"), { code: "ENOENT" }));
      await expect(service.getRunAvailability("run-1")).resolves.toBe("Missing");
    });
  });

  describe("deleteArchive", () => {
    it("marks row as removed without touching the filesystem when finalPath is null", async () => {
      findUniqueOrThrow.mockResolvedValue({ ...localRow, finalPath: null });
      await service.deleteArchive(localRow.id);
      expect(fsUnlink).not.toHaveBeenCalled();
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ archiveDeletedAt: expect.any(Date) }) }),
      );
      expect(publisher.publishRun).toHaveBeenCalled();
    });

    it("short-circuits when archiveDeletedAt is already set", async () => {
      findUniqueOrThrow.mockResolvedValue({ ...localRow, archiveDeletedAt: new Date() });
      await service.deleteArchive(localRow.id);
      expect(fsUnlink).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
      expect(publisher.publishRun).not.toHaveBeenCalled();
    });

    it("unlinks the local file, flips archiveDeletedAt, and publishes", async () => {
      findUniqueOrThrow.mockResolvedValue(localRow);
      fsUnlink.mockResolvedValue(undefined);
      await service.deleteArchive(localRow.id);
      expect(fsUnlink).toHaveBeenCalledWith(localRow.finalPath);
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: localRow.id },
          data: expect.objectContaining({ archiveDeletedAt: expect.any(Date) }),
        }),
      );
      expect(publisher.publishRun).toHaveBeenCalledWith(localRow.runId, expect.any(String));
    });

    it("still marks removed when the local file was already gone (idempotent)", async () => {
      findUniqueOrThrow.mockResolvedValue(localRow);
      fsUnlink.mockRejectedValue(Object.assign(new Error("no"), { code: "ENOENT" }));
      await expect(service.deleteArchive(localRow.id)).resolves.toBeDefined();
      expect(update).toHaveBeenCalled();
      expect(publisher.publishRun).toHaveBeenCalled();
    });

    it("sends DeleteObject for S3 destinations", async () => {
      findUniqueOrThrow.mockResolvedValue(s3Row);
      sendMock.mockResolvedValue({});
      await service.deleteArchive(s3Row.id);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          __type: "Delete",
          input: { Bucket: "my-bucket", Key: "prefix/skeleton-20260507T120000Z.tar.gz.age" },
        }),
      );
      expect(update).toHaveBeenCalled();
      expect(publisher.publishRun).toHaveBeenCalled();
    });

    it("throws for an invalid S3 URI", async () => {
      findUniqueOrThrow.mockResolvedValue({ ...s3Row, destination: { ...s3Row.destination, output: "not-s3" } });
      await expect(service.deleteArchive(s3Row.id)).rejects.toThrow(/invalid S3 output URI/);
      expect(sendMock).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });

    it("rethrows unexpected local errors without marking removed", async () => {
      findUniqueOrThrow.mockResolvedValue(localRow);
      fsUnlink.mockRejectedValue(Object.assign(new Error("perm"), { code: "EACCES" }));
      await expect(service.deleteArchive(localRow.id)).rejects.toThrow("perm");
      expect(update).not.toHaveBeenCalled();
    });
  });
});
