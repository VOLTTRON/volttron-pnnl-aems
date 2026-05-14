"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BackupDiscoveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupDiscoveryService = void 0;
const app_config_1 = require("../../app.config");
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const yaml_1 = require("yaml");
const SCAN_DEPTH = 3;
const SCAN_EXCLUDE_DIRS = new Set([
    "node_modules",
    ".git",
    ".next",
    ".yarn",
    ".cache",
    "dist",
    "build",
    "coverage",
    "out",
]);
const DB_IMAGE_TOKENS = ["postgres", "postgis", "mariadb", "mysql"];
let BackupDiscoveryService = BackupDiscoveryService_1 = class BackupDiscoveryService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(BackupDiscoveryService_1.name);
    }
    async discover() {
        const now = Date.now();
        if (this.cache && now - this.cache.at < BackupDiscoveryService_1.CACHE_TTL_MS) {
            return this.cache.value;
        }
        const workspace = this.workspacePath();
        if (!workspace) {
            this.logger.warn("BACKUP_WORKSPACE is not set; returning empty discovery");
            const empty = { services: [], volumes: [], paths: [], envFiles: [] };
            this.cache = { at: now, value: empty };
            return empty;
        }
        const compose = this.parseCompose(workspace);
        const envFiles = await this.scanEnvFiles(workspace, compose.envFilePaths);
        const value = {
            services: compose.services,
            volumes: compose.volumes,
            paths: compose.paths,
            envFiles,
        };
        this.cache = { at: now, value };
        return value;
    }
    workspacePath() {
        const configured = this.configService.service.backup?.workspace?.trim();
        if (configured)
            return configured;
        return null;
    }
    parseCompose(workspace) {
        const composePath = (0, path_1.join)(workspace, "docker", "docker-compose.yml");
        if (!(0, fs_1.existsSync)(composePath)) {
            this.logger.warn(`docker-compose.yml not found at ${composePath}`);
            return { services: [], volumes: [], paths: [], envFilePaths: [] };
        }
        let doc;
        try {
            doc = (0, yaml_1.parse)((0, fs_1.readFileSync)(composePath, "utf-8"));
        }
        catch (err) {
            this.logger.warn(`failed to parse ${composePath}: ${err.message}`);
            return { services: [], volumes: [], paths: [], envFilePaths: [] };
        }
        const root = (doc ?? {});
        const services = (root.services ?? {});
        const topVolumes = new Set(Object.keys((root.volumes ?? {})));
        const composeDir = (0, path_1.join)(workspace, "docker");
        const serviceList = [];
        const volMap = new Map();
        const bindMap = new Map();
        const envFilePaths = new Set();
        const selfRefServices = new Set();
        const dumpStrategyServices = new Set();
        const profileGatedServices = new Set();
        const activeProfiles = new Set(this.configService.service.backup?.composeProfiles ?? []);
        for (const [svcName, raw] of Object.entries(services)) {
            const svc = (raw ?? {});
            const image = typeof svc.image === "string" ? svc.image : null;
            const isSelfRef = this.mountsDockerSock(svc);
            if (isSelfRef)
                selfRefServices.add(svcName);
            const svcProfiles = Array.isArray(svc.profiles)
                ? svc.profiles.filter((p) => typeof p === "string")
                : [];
            const isProfileGated = svcProfiles.length > 0 && !svcProfiles.some((p) => activeProfiles.has(p));
            if (isProfileGated)
                profileGatedServices.add(svcName);
            let hasVolume = false;
            const volumes = Array.isArray(svc.volumes) ? svc.volumes : [];
            for (const entry of volumes) {
                let source;
                let vtype;
                if (entry && typeof entry === "object" && !Array.isArray(entry)) {
                    const obj = entry;
                    source = obj.source;
                    vtype = obj.type;
                }
                else if (typeof entry === "string") {
                    const parts = entry.split(":");
                    source = parts[0];
                    vtype = source && topVolumes.has(source) ? "volume" : "bind";
                }
                if (!source)
                    continue;
                hasVolume = true;
                if (vtype === "volume" || topVolumes.has(source)) {
                    const set = volMap.get(source) ?? new Set();
                    set.add(svcName);
                    volMap.set(source, set);
                }
                else if (vtype === "bind") {
                    const abs = (0, path_1.resolve)(composeDir, source);
                    const existing = bindMap.get(abs) ?? { type: this.classifyBind(abs), services: new Set() };
                    existing.services.add(svcName);
                    bindMap.set(abs, existing);
                }
            }
            const envFile = svc.env_file;
            if (typeof envFile === "string") {
                envFilePaths.add(this.normalizeEnvPath(workspace, (0, path_1.join)("docker", envFile)));
            }
            else if (Array.isArray(envFile)) {
                for (const f of envFile) {
                    if (typeof f === "string") {
                        envFilePaths.add(this.normalizeEnvPath(workspace, (0, path_1.join)("docker", f)));
                    }
                    else if (f && typeof f === "object" && typeof f.path === "string") {
                        envFilePaths.add(this.normalizeEnvPath(workspace, (0, path_1.join)("docker", f.path)));
                    }
                }
            }
            const engine = this.dbEngine(image) ?? this.dbEngineFromBuild(svc, composeDir);
            const backupStrategy = engine === "Postgres" ? "pg_dump" : engine === "MariaDB" ? "mysqldump" : null;
            if (backupStrategy)
                dumpStrategyServices.add(svcName);
            let svcReason = null;
            if (isSelfRef)
                svcReason = "self-reference";
            else if (isProfileGated)
                svcReason = "profile-gated";
            serviceList.push({
                name: svcName,
                hasVolume,
                image,
                engine,
                imageFamily: this.imageFamily(image),
                backupStrategy,
                autoExclude: svcReason !== null,
                autoExcludeReason: svcReason,
            });
        }
        serviceList.sort((a, b) => a.name.localeCompare(b.name));
        const workspaceAbs = (0, path_1.resolve)(workspace);
        const secretsRootAbs = (0, path_1.resolve)(workspaceAbs, "docker", "secrets");
        const isInsideWorkspace = (p) => {
            const rel = (0, path_1.relative)(workspaceAbs, p);
            return rel !== "" && !rel.startsWith("..") && !(0, path_1.isAbsolute)(rel);
        };
        const isSecretsContent = (p) => {
            const rel = (0, path_1.relative)(secretsRootAbs, p);
            return rel === "" || (!rel.startsWith("..") && !(0, path_1.isAbsolute)(rel));
        };
        const volumeList = [...volMap.entries()]
            .map(([name, svcs]) => {
            const services = [...svcs].sort();
            const allSelfRef = services.length > 0 && services.every((s) => selfRefServices.has(s));
            const allProfileGated = services.length > 0 && services.every((s) => profileGatedServices.has(s));
            const isCache = /cache/i.test(name);
            const touchedByDbDump = services.some((s) => dumpStrategyServices.has(s));
            let reason = null;
            if (allSelfRef)
                reason = "self-reference";
            else if (touchedByDbDump)
                reason = "database-dump";
            else if (allProfileGated)
                reason = "profile-gated";
            else if (isCache)
                reason = "cache";
            return {
                name,
                services,
                autoExclude: reason !== null,
                autoExcludeReason: reason,
            };
        })
            .sort((a, b) => a.name.localeCompare(b.name));
        const pathList = [...bindMap.entries()]
            .map(([path, v]) => {
            const services = [...v.services].sort();
            const allSelfRef = services.length > 0 && services.every((s) => selfRefServices.has(s));
            const allProfileGated = services.length > 0 && services.every((s) => profileGatedServices.has(s));
            let reason = null;
            if (v.type === "socket") {
                reason = "socket";
            }
            else if (path === workspaceAbs) {
                reason = "self-reference";
            }
            else if (allSelfRef) {
                reason = "self-reference";
            }
            else if (allProfileGated) {
                reason = "profile-gated";
            }
            else if (isInsideWorkspace(path) && !isSecretsContent(path)) {
                reason = "repo-content";
            }
            return {
                path,
                type: v.type,
                services,
                autoExclude: reason !== null,
                autoExcludeReason: reason,
            };
        })
            .sort((a, b) => a.path.localeCompare(b.path));
        return { services: serviceList, volumes: volumeList, paths: pathList, envFilePaths: [...envFilePaths] };
    }
    mountsDockerSock(svc) {
        const volumes = Array.isArray(svc.volumes) ? svc.volumes : [];
        for (const entry of volumes) {
            let source;
            if (entry && typeof entry === "object" && !Array.isArray(entry)) {
                source = entry.source;
            }
            else if (typeof entry === "string") {
                source = entry.split(":")[0];
            }
            if (source && /(^|\/)var\/run\/docker\.sock$/.test(source))
                return true;
        }
        return false;
    }
    classifyBind(abs) {
        try {
            const s = (0, fs_1.statSync)(abs);
            if (s.isSocket())
                return "socket";
            return s.isDirectory() ? "directory" : "file";
        }
        catch {
            const base = abs.split(/[\\/]/).pop() ?? "";
            return base.includes(".") ? "file" : "directory";
        }
    }
    dbEngine(image) {
        const img = (image ?? "").toLowerCase();
        if (!DB_IMAGE_TOKENS.some((t) => img.includes(t)))
            return null;
        if (img.includes("mariadb") || (img.includes("mysql") && !img.includes("postgres")))
            return "MariaDB";
        return "Postgres";
    }
    dbEngineFromBuild(svc, composeDir) {
        const build = svc.build;
        let contextPath;
        let dockerfileName = "Dockerfile";
        if (typeof build === "string") {
            contextPath = (0, path_1.resolve)(composeDir, build);
        }
        else if (build && typeof build === "object") {
            const b = build;
            contextPath = (0, path_1.resolve)(composeDir, b.context ?? ".");
            if (b.dockerfile)
                dockerfileName = b.dockerfile;
        }
        else {
            return null;
        }
        const dockerfilePath = (0, path_1.resolve)(contextPath, dockerfileName);
        if (!(0, fs_1.existsSync)(dockerfilePath))
            return null;
        let content;
        try {
            content = (0, fs_1.readFileSync)(dockerfilePath, "utf-8");
        }
        catch {
            return null;
        }
        const froms = content
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => /^FROM\s+/i.test(l));
        const lastFrom = froms[froms.length - 1];
        if (!lastFrom)
            return null;
        const m = /^FROM\s+(\S+)/i.exec(lastFrom);
        if (!m)
            return null;
        return this.dbEngine(m[1]);
    }
    imageFamily(image) {
        const raw = (image ?? "").trim();
        if (!raw)
            return null;
        const noDigest = raw.split("@")[0];
        const segments = noDigest.split("/").filter(Boolean);
        if (segments.length === 0)
            return null;
        if (segments.length > 1 && /[.:]/.test(segments[0]))
            segments.shift();
        const last = segments[segments.length - 1];
        const name = last.split(":")[0].trim();
        if (!name || name.startsWith("$"))
            return null;
        return name.toLowerCase();
    }
    normalizeEnvPath(workspace, p) {
        const abs = (0, path_1.resolve)(workspace, p);
        const rel = (0, path_1.relative)(workspace, abs).replace(/\\/g, "/");
        return rel;
    }
    async scanEnvFiles(workspace, composeEnvPaths) {
        const scanned = new Set();
        await this.walkEnvFiles(workspace, workspace, 0, scanned);
        const candidates = new Set([...scanned, ...composeEnvPaths]);
        const userModified = this.userModifiedPaths(workspace, [...candidates]);
        const reasonFor = (p) => userModified && !userModified.has(p) ? "unchanged" : null;
        const bySource = new Map();
        for (const p of scanned) {
            const reason = reasonFor(p);
            bySource.set(p, {
                path: p,
                exists: true,
                source: "scanned",
                autoExclude: reason !== null,
                autoExcludeReason: reason,
            });
        }
        for (const p of composeEnvPaths) {
            if (!bySource.has(p)) {
                const abs = (0, path_1.resolve)(workspace, p);
                const exists = (0, fs_1.existsSync)(abs);
                const reason = exists ? reasonFor(p) : null;
                bySource.set(p, {
                    path: p,
                    exists,
                    source: "compose",
                    autoExclude: reason !== null,
                    autoExcludeReason: reason,
                });
            }
        }
        return [...bySource.values()].sort((a, b) => a.path.localeCompare(b.path));
    }
    userModifiedPaths(workspace, paths) {
        if (paths.length === 0)
            return new Set();
        const run = (args) => (0, child_process_1.execFileSync)("git", ["-C", workspace, ...args], {
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "ignore"],
        });
        try {
            const pathspec = ["--", ...paths];
            const modified = run(["diff", "--name-only", "-z", "HEAD", ...pathspec]);
            const untracked = run(["ls-files", "--others", "--exclude-standard", "-z", ...pathspec]);
            const ignoredPresent = run([
                "ls-files",
                "--others",
                "--ignored",
                "--exclude-standard",
                "-z",
                ...pathspec,
            ]);
            const parse = (s) => s
                .split("\0")
                .filter(Boolean)
                .map((p) => p.replace(/\\/g, "/"));
            return new Set([...parse(modified), ...parse(untracked), ...parse(ignoredPresent)]);
        }
        catch (err) {
            this.logger.log(`git-based env-file change detection unavailable (${err.message}); all scanned env files will be treated as user-modified`);
            return null;
        }
    }
    async walkEnvFiles(root, dir, depth, out) {
        if (depth > SCAN_DEPTH)
            return;
        let entries;
        try {
            entries = await (0, promises_1.readdir)(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const e of entries) {
            if (e.isDirectory()) {
                if (SCAN_EXCLUDE_DIRS.has(e.name))
                    continue;
                await this.walkEnvFiles(root, (0, path_1.join)(dir, e.name), depth + 1, out);
            }
            else if (e.isFile() && e.name.startsWith(".env")) {
                const rel = (0, path_1.relative)(root, (0, path_1.join)(dir, e.name)).replace(/\\/g, "/");
                out.add(rel);
            }
        }
    }
};
exports.BackupDiscoveryService = BackupDiscoveryService;
BackupDiscoveryService.CACHE_TTL_MS = 30_000;
exports.BackupDiscoveryService = BackupDiscoveryService = BackupDiscoveryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService])
], BackupDiscoveryService);
//# sourceMappingURL=backup-discovery.service.js.map