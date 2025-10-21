import { authUser } from "@/auth";
import { HttpStatus } from "@/common";
import { prisma } from "@/prisma";
import { readFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { resolve, join } from "path";

const handleRequest = async (req: NextRequest, { params }: { params: { id: string; name: string } }) => {
  const auth = await authUser();

  if (!auth.roles.user) {
    return NextResponse.json(HttpStatus.Unauthorized, HttpStatus.Unauthorized);
  }

  const file = await prisma.file.findUnique({
    where: {
      id: params.id,
    },
  });

  if (file === null) {
    return NextResponse.json(HttpStatus.NotFound, HttpStatus.NotFound);
  }

  // Path to the file
  const uploadDir = resolve(process.cwd(), process.env.FILE_UPLOAD_PATH || "./tmp/upload/");
  const relativePath = join(uploadDir, file.objectKey);

  try {
    // Read the file content as a buffer
    const fileContent = await readFile(relativePath);

    // Create the response with the file content
    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        // Content-Disposition header instructs the browser to download the file
        // 'attachment' indicates it should be downloaded rather than displayed in the browser window.
        // 'filename' suggests the name for the downloaded file
        "Content-Disposition": `attachment; filename="${params.name}"`,
      },
    });
  } catch (error) {
    console.error(`Error reading file: ${error}`);
    return NextResponse.json(HttpStatus.NotFound, HttpStatus.NotFound);
  }
};

export { handleRequest as GET };
