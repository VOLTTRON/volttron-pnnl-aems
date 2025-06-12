import { HttpStatus, RoleType } from "@local/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Controller, Get, Inject, Logger, Param, Post, Res, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { existsSync } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Roles } from "@/auth/roles.decorator";
import { User } from "@/auth/user.decorator";
import { ApiBody, ApiConsumes, ApiProperty, ApiTags } from "@nestjs/swagger";
import { AppConfigService } from "@/app.config";
import { PrismaClient } from "@prisma/client";
import { getObjectKey } from "@/utils/file";
import "multer";

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

/**
 * Removes file metadata from the database and deletes the corresponding files from the filesystem.
 * This function is designed to clean up partially uploaded files in case of an error. All or nothing.
 *
 * @param fileMetadataIds - An array of file metadata IDs to be removed from the database.
 * @param filePaths - An array of file paths to be deleted from the filesystem.
 * @returns A promise that resolves when all delete operations are completed.
 */
async function cleanupPartialUploads(
  fileMetadataIds: string[],
  filePaths: string[],
  prisma: PrismaClient,
  logger: Logger,
) {
  const dbPromises = fileMetadataIds.map((id) =>
    prisma.file
      .delete({ where: { id } })
      .catch((error) => logger.error(`Error removing file metadata for ID ${id}:`, error)),
  );

  const fsPromises = filePaths.map((path) =>
    unlink(path).catch((error) => logger.error(`Error removing local file at ${path}:`, error)),
  );

  await Promise.all([...dbPromises, ...fsPromises]);
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
  @UseInterceptors(FilesInterceptor("files"))
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

    // Track successfully uploaded files and their corresponding database entries.
    // If an operation fails, we'll use these arrays to clean up any files and database records created before the failure.
    const fsFiles: string[] = [];
    const dbFiles: string[] = [];

    const ids: string[] = [];
    const failed: string[] = [];

    for (const file of files) {
      try {
        const bytes = file.buffer;
        const buffer = Buffer.from(bytes);
        const contentLength = buffer.length;
        const fileName = getObjectKey({ name: file.filename });
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

        fsFiles.push(fileName);
        dbFiles.push(recordedFile.id);
        ids.push(recordedFile.id);
      } catch (error) {
        this.logger.error("Failed to upload file", error);
        failed.push(file.originalname);
      }
    }

    if (failed.length > 0) {
      cleanupPartialUploads(
        dbFiles,
        fsFiles.map((f) => join(uploadDir, f)),
        this.prismaService.prisma,
        this.logger,
      ).catch((error) => this.logger.error("Failed to clean up partial uploads", error));
    }

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

    const filePath = resolve(process.cwd(), this.configType.file.uploadPath, file.objectKey);

    res.setHeader("Content-Disposition", `attachment; filename=${name}`);
    res.setHeader("Content-Type", file.mimeType);
    return res.sendFile(filePath);
  }
}
