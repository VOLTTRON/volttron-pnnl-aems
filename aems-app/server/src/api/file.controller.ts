import { HttpStatus, RoleType } from "@local/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Controller, Get, Inject, Logger, Param, Post, Res, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Roles } from "@/auth/roles.decorator";
import { User } from "@/auth/user.decorator";
import { ApiBody, ApiConsumes, ApiProperty, ApiTags } from "@nestjs/swagger";
import { AppConfigService } from "@/app.config";
import type { PrismaClient } from "@prisma/client";
import { getObjectKey } from "@/utils/file";
import "multer";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export const MAX_UPLOAD_FILES = 10;
export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

export type UploadFailure = { name: string; reason: string };

/**
 * Saves the file data to the local filesystem and its metadata to the database.
 * The metadata includes the object key (which serves as the unique identifier),
 * MIME type, content length, and associated user.
 *
 * @param userId - The ID of the user associated with the file.
 * @param objectKey - The unique key assigned to the file (used as identifier in database).
 * @param mimeType - The MIME type of the file (e.g., 'application/pdf', 'image/png').
 * @param contentLength - The size of the file in bytes.
 * @param buffer - The Buffer containing the file data to be written to the filesystem.
 * @returns A promise that resolves with the created file record in the database.
 */
async function uploadFile(
  userId: string,
  objectKey: string,
  mimeType: string,
  contentLength: number,
  filePath: string,
  buffer: Buffer,
  prisma: PrismaClient,
) {
  try {
    // Write the file data to the local filesystem
    await writeFile(filePath, buffer);

    // Save the file metadata to the database. Returns id.
    const file = await prisma.file.create({
      data: {
        objectKey,
        mimeType,
        contentLength,
        user: { connect: { id: userId } },
      },
    });
    return file;
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      // The .code property can be accessed in a type-safe manner
      if (error.code === "P2002") {
        throw new Error("A file with this objectKey already exists.");
      } else if (error.code === "P2003") {
        throw new Error("The specified user does not exist.");
      }
    }
    // For other types of errors, or if you want a catch-all
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function describeUploadError(error: unknown): string {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === "P2002") return "A file with this objectKey already exists.";
    if (error.code === "P2003") return "The specified user does not exist.";
    return `Database error (${error.code}).`;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

class FilesUploadDto {
  @ApiProperty({ type: "array", items: { type: "string", format: "binary" } })
  files: any[] = [];
}

@ApiTags("file")
@Controller("file")
export class FileController {
  private logger = new Logger(FileController.name);

  constructor(
    private prismaService: PrismaService,
    @Inject(AppConfigService.Key) private configType: AppConfigService,
  ) {}

  @ApiTags("file", "upload")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    type: FilesUploadDto,
  })
  @Roles(RoleType.User)
  @UseInterceptors(
    FilesInterceptor("files", MAX_UPLOAD_FILES, {
      limits: { fileSize: MAX_UPLOAD_SIZE },
      // Accept every file at the multer boundary. A disallowed type is caught in
      // the handler so it can be reported by name with its reason, rather than
      // silently dropped as cb(null, false) does.
      fileFilter: (_req, _file, cb) => cb(null, true),
    }),
  )
  @Post("upload")
  async upload(@User() user: Express.User, @Res() res: Response, @UploadedFiles() files: Express.Multer.File[]) {
    if (files.length === 0) {
      return res
        .status(HttpStatus.BadRequest.status)
        .json({ ...HttpStatus.BadRequest, error: "No files were uploaded" });
    }

    const uploadDir = resolve(process.cwd(), this.configType.file.uploadPath);

    try {
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
    } catch (error) {
      this.logger.error("Failed to create local directory", error);
      return res
        .status(HttpStatus.InternalServerError.status)
        .json({ ...HttpStatus.InternalServerError, error: "File upload failed" });
    }

    const ids: string[] = [];
    const failed: UploadFailure[] = [];

    for (const file of files) {
      // Type check first — a disallowed mimetype is reported, never stored.
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        failed.push({ name: file.originalname, reason: `Disallowed type: ${file.mimetype}` });
        continue;
      }
      try {
        const bytes = file.buffer;
        const buffer = Buffer.from(bytes);
        const contentLength = buffer.length;
        if (contentLength > MAX_UPLOAD_SIZE) {
          failed.push({ name: file.originalname, reason: `File exceeds ${MAX_UPLOAD_SIZE} bytes` });
          continue;
        }
        const fileName = getObjectKey({ name: file.originalname });
        const filePath = join(uploadDir, fileName);

        const recordedFile = await uploadFile(
          user?.id ?? "",
          fileName,
          file.mimetype,
          contentLength,
          filePath,
          buffer,
          this.prismaService.prisma,
        );

        ids.push(recordedFile.id);
      } catch (error) {
        this.logger.error("Failed to upload file", error);
        failed.push({ name: file.originalname, reason: describeUploadError(error) });
      }
    }

    // The files that succeeded stay stored — exactly those are returned in `ids`.
    // Failed files have been rolled back by the per-file try/catch and were never
    // added to `ids`, so no cross-file cleanup is needed.
    return res.json({ success: ids.length > 0, ids, ...(failed.length > 0 && { failed }) });
  }

  @ApiTags("file", "download")
  @Roles(RoleType.User)
  @Get(":id/download/:name")
  async download(@Res() res: Response, @Param("id") id: string, @Param("name") name: string) {
    const file = await this.prismaService.prisma.file.findFirst({
      where: { id },
      select: { objectKey: true, mimeType: true },
    });

    if (!file) {
      return res.status(HttpStatus.NotFound.status).json({ ...HttpStatus.NotFound, error: "File not found" });
    }

    const uploadDir = resolve(process.cwd(), this.configType.file.uploadPath);
    const filePath = resolve(uploadDir, file.objectKey);
    if (!isPathInside(filePath, uploadDir)) {
      this.logger.warn(`Refused download: resolved path ${filePath} escapes ${uploadDir}`);
      return res
        .status(HttpStatus.NotFound.status)
        .json({ ...HttpStatus.NotFound, error: "File not found" });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${sanitizeFilename(name)}"`);
    res.setHeader("Content-Type", file.mimeType);
    return res.sendFile(filePath);
  }
}

// A resolved child path lies inside parent iff it equals parent, or starts with
// parent + path separator. Compared as the OS resolved them (case preserved).
export function isPathInside(child: string, parent: string): boolean {
  const sep = parent.includes("\\") ? "\\" : "/";
  const normChild = child.replace(/[\\/]+/g, sep);
  const normParent = parent.replace(/[\\/]+/g, sep).replace(new RegExp(`\\${sep}$`), "");
  return normChild === normParent || normChild.startsWith(normParent + sep);
}

// Keep only characters safe inside a quoted Content-Disposition filename:
// drop CR/LF/quote/backslash and path separators; collapse the rest.
export function sanitizeFilename(name: string): string {
  const stripped = (name ?? "").replace(/[\r\n"\\/\x00]/g, "").trim();
  return stripped.length > 0 ? stripped : "download";
}
