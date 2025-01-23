import { randomUUID } from "node:crypto";

/**
 * Generate new unique name for file
 * 
 * @param file - The file object to be saved.
 * @returns A promise that resolves with an object containing:
 *  - objectKey: The new unique name of the file, including the extension.
 */
export function getObjectKey(file: File): string {
    const parts = file.name.split('.');
    const extension = parts.length > 1 ? parts.pop() : '';
    return extension ? `${randomUUID()}.${extension}` : randomUUID();
}