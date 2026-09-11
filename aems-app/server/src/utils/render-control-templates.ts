import { Logger } from "@nestjs/common";
import { basename, extname, resolve } from "node:path";
import { readFile, stat } from "node:fs/promises";
import { getConfigFiles } from "@/utils/file";
import { transformTemplate } from "@/utils/template";

export async function renderControlTemplates(
  control: unknown,
  templatePaths: string[],
  logger?: Logger,
): Promise<Record<string, unknown>> {
  if (templatePaths.length === 0) return {};
  const resolved = templatePaths.map((p) => resolve(p));
  const existing: string[] = [];
  const missing: string[] = [];
  for (const path of resolved) {
    if (await stat(path).catch(() => null)) {
      existing.push(path);
    } else {
      missing.push(path);
      logger?.warn(`Template path does not exist, skipping: ${path}`);
    }
  }
  if (existing.length === 0) {
    throw new Error(
      `None of the configured ILC template paths exist: ${missing.join(", ")}. ` +
        `Check SERVICE_SETUP_TEMPLATE_PATHS and that the volttron-setup sidecar has populated the templates directory.`,
    );
  }
  const data: Record<string, unknown> = {};
  for (const file of await getConfigFiles(existing, ".json", logger)) {
    const key = basename(file, extname(file));
    const text = await readFile(resolve(file), "utf-8");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const template = JSON.parse(text);
    data[key] = transformTemplate(template, control);
  }
  return data;
}
