import { typeofObject } from "@local/common";
import { Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Generate new unique name for file
 *
 * @param file - The file object to be saved.
 * @returns A promise that resolves with an object containing:
 *  - objectKey: The new unique name of the file, including the extension.
 */
export function getObjectKey(file: File | { name: string }): string {
  const parts = file.name.split(".");
  const extension = parts.length > 1 ? parts.pop() : "";
  return extension ? `${randomUUID()}.${extension}` : randomUUID();
}

/**
 * Recursively get all config files from the given paths.
 *
 * @param paths - An array of paths to search for config files.
 * @param filter - Optional RegExp filter to apply on file names or string to match file extension.
 * @param logger - Optional logger to log warnings.
 * @returns A promise that resolves with an array of config file paths.
 */
export async function getConfigFiles(paths: string[], filter?: string | RegExp, logger?: Logger) {
  const test = typeofObject<RegExp>(filter, (v) => "test" in v)
    ? (file: string) => filter.test(file)
    : typeof filter === "string"
      ? (file: string) => file.endsWith(filter)
      : () => true;
  const files: string[] = [];
  for (const path of paths) {
    const file = resolve(process.cwd(), path);
    const dirent = await stat(file);
    if (dirent.isFile()) {
      if (test(file)) {
        files.push(file);
      }
    } else if (dirent.isDirectory()) {
      files.push(...(await getConfigFiles(await readdir(file))));
    } else {
      logger?.warn(`Skipping non-file and non-directory: ${file}`);
    }
  }
  return files;
}
