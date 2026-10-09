import { Logger } from "@nestjs/common";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { parseDashboardFilename } from "@/grafana/filename";
import { getConfigFiles } from "@/utils/file";

export interface DashboardConfigEntry {
  key: string;
  url: string;
  keycloakRole?: string;
}

export interface DashboardConfigFile {
  file: string;
  campus: string;
  building: string;
  entries: DashboardConfigEntry[];
}

// The one reader every caller shares. No cache: each call lists and reads the
// directory, so a file written after start is seen by the next call.
export async function readDashboardConfigs(
  configPath: string,
  logger?: Logger,
): Promise<DashboardConfigFile[]> {
  if (!configPath) return [];
  const files = await getConfigFiles([configPath], ".json", logger);
  const out: DashboardConfigFile[] = [];
  for (const file of files) {
    const parsed = parseDashboardFilename(basename(file));
    if (!parsed) {
      logger?.warn(`Skipping dashboard config with unrecognised filename: ${basename(file)}`);
      continue;
    }
    let json: unknown;
    try {
      json = JSON.parse(await readFile(resolve(file), "utf-8"));
    } catch (error) {
      logger?.error(`Error reading dashboard config ${file}:`, error);
      continue;
    }
    if (!json || typeof json !== "object") continue;
    const entries: DashboardConfigEntry[] = [];
    for (const [key, value] of Object.entries(json as Record<string, unknown>)) {
      if (typeof value === "string") {
        entries.push({ key, url: value });
      } else if (value && typeof value === "object") {
        const v = value as { url?: unknown; keycloak_role?: unknown };
        if (typeof v.url === "string") {
          entries.push({
            key,
            url: v.url,
            keycloakRole: typeof v.keycloak_role === "string" ? v.keycloak_role : undefined,
          });
        }
      }
    }
    out.push({
      file,
      campus: parsed.campus.toLowerCase(),
      building: parsed.building.toLowerCase(),
      entries,
    });
  }
  return out;
}
