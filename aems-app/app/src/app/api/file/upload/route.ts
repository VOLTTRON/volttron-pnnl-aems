import { authUser } from "@/auth";
import { HttpStatus } from "@/common";
import { logger } from "@/logging";
import { prisma } from "@/prisma";
import { getObjectKey } from "@/utils/file";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { existsSync } from "fs";
import { mkdir, unlink, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { join, resolve } from "path";

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
  buffer: Buffer
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
async function cleanupPartialUploads(fileMetadataIds: string[], filePaths: string[]) {
  const dbPromises = fileMetadataIds.map((id) =>
    prisma.file
      .delete({ where: { id } })
      .catch((error) => console.error(`Error removing file metadata for ID ${id}:`, error))
  );

  const fsPromises = filePaths.map((path) =>
    unlink(path).catch((error) => console.error(`Error removing local file at ${path}:`, error))
  );

  await Promise.all([...dbPromises, ...fsPromises]);
}

const handleRequest = async (req: NextRequest) => {
  const auth = await authUser();

  if (!auth.roles.user) {
    return NextResponse.json(HttpStatus.Unauthorized, HttpStatus.Unauthorized);
  }

  const data = await req.formData();
  const files = data.getAll("files") as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ ...HttpStatus.BadRequest, error: "No files were uploaded" }, HttpStatus.BadRequest);
  }

  // Track successfully uploaded files and their corresponding database entries.
  // If an operation fails, we'll use these arrays to clean up any files and database records created before the failure.
  const fsFiles: string[] = [];
  const dbFiles: string[] = [];

  const uploadDir = resolve(process.cwd(), process.env.FILE_UPLOAD_PATH || "./tmp/upload/");

  try {
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
  } catch (error) {
    logger.error("Failed to create local directory", error);
    return NextResponse.json(
      { ...HttpStatus.InternalServerError, error: "File upload failed" },
      HttpStatus.InternalServerError
    );
  }

  try {
    const uploadedFileId = files.map(async (file: File) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const contentLength = buffer.length;
      const fileName = getObjectKey(file);
      const filePath = join(uploadDir, fileName);

      const recordedFile = await uploadFile(auth.id ?? "", fileName, file.type, contentLength, filePath, buffer);

      fsFiles.push(fileName);
      dbFiles.push(recordedFile.id);
      return recordedFile.id;
    });

    const ids: string[] = await Promise.all(uploadedFileId).catch((error) => {
      throw new Error("Could not upload all files", error);
    });

    return NextResponse.json({ success: true, ids });
  } catch (error) {
    logger.error("Failed to upload file", error);
    await cleanupPartialUploads(dbFiles, fsFiles);

    return NextResponse.json(
      { ...HttpStatus.InternalServerError, error: "File upload failed" },
      HttpStatus.InternalServerError
    );
  }
};

export { handleRequest as POST };
