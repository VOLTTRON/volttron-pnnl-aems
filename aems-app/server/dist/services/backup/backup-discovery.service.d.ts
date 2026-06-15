import { AppConfigService } from "@/app.config";
export type BackupEngine = "Postgres" | "MariaDB";
export type BackupStrategy = "pg_dump" | "mysqldump";
export type BackupAutoExcludeReason = "self-reference" | "cache" | "database-dump" | "repo-content" | "socket" | "profile-gated" | "unchanged";
export interface BackupDiscoveredService {
    name: string;
    hasVolume: boolean;
    image: string | null;
    engine: BackupEngine | null;
    imageFamily: string | null;
    backupStrategy: BackupStrategy | null;
    autoExclude: boolean;
    autoExcludeReason: BackupAutoExcludeReason | null;
}
export interface BackupDiscoveredVolume {
    name: string;
    services: string[];
    autoExclude: boolean;
    autoExcludeReason: BackupAutoExcludeReason | null;
}
export interface BackupDiscoveredPath {
    path: string;
    type: "directory" | "file" | "socket";
    services: string[];
    autoExclude: boolean;
    autoExcludeReason: BackupAutoExcludeReason | null;
}
export interface BackupDiscoveredEnvFile {
    path: string;
    exists: boolean;
    source: "scanned" | "compose";
    autoExclude: boolean;
    autoExcludeReason: BackupAutoExcludeReason | null;
}
export interface BackupDiscovery {
    services: BackupDiscoveredService[];
    volumes: BackupDiscoveredVolume[];
    paths: BackupDiscoveredPath[];
    envFiles: BackupDiscoveredEnvFile[];
}
export declare class BackupDiscoveryService {
    private configService;
    private static readonly CACHE_TTL_MS;
    private logger;
    private cache?;
    constructor(configService: AppConfigService);
    discover(): Promise<BackupDiscovery>;
    private workspacePath;
    private parseCompose;
    private mountsDockerSock;
    private classifyBind;
    private dbEngine;
    private dbEngineFromBuild;
    private imageFamily;
    private normalizeEnvPath;
    private scanEnvFiles;
    private userModifiedPaths;
    private walkEnvFiles;
}
