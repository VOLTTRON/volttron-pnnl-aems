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
var SeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const path_1 = require("path");
const promises_1 = require("fs/promises");
const lodash_1 = require("lodash");
const common_1 = require("@nestjs/common");
const __1 = require("..");
const prisma_service_1 = require("../../prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
const app_config_1 = require("../../app.config");
const common_2 = require("@local/common");
let SeedService = SeedService_1 = class SeedService extends __1.BaseService {
    constructor(prismaService, configService) {
        super("seed", configService);
        this.prismaService = prismaService;
        this.logger = new common_1.Logger(SeedService_1.name);
        this.normalizer = common_2.NormalizationType.process(common_2.NormalizationType.NFD, common_2.NormalizationType.Lowercase, common_2.NormalizationType.Concatenate, common_2.NormalizationType.Letters, common_2.NormalizationType.Numbers);
        this.path = configService.service.seed.dataPath;
    }
    execute() {
        return super.execute();
    }
    async task() {
        const seeders = await this.prismaService.prisma.seed.findMany({ select: { filename: true, timestamp: true } });
        const seeded = [];
        const files = await (0, promises_1.readdir)((0, path_1.resolve)(process.cwd(), this.path), { withFileTypes: true });
        this.logger.log(`Running the database seeder files...`);
        for (const file of files) {
            try {
                const ext = (0, path_1.extname)(file.name);
                if (/\.json/i.test(ext)) {
                    if (file.isFile()) {
                        const metadata = await (0, promises_1.stat)((0, path_1.resolve)(process.cwd(), this.path, file.name));
                        const seed = seeders.find((v) => v.filename === file.name) ?? {
                            filename: file.name,
                            timestamp: new Date(0),
                        };
                        if (metadata.mtime > seed.timestamp) {
                            this.logger.log(`Running seeder ${file.name}...`);
                            try {
                                const seeder = JSON.parse(await (0, promises_1.readFile)((0, path_1.resolve)(file.parentPath, file.name), "utf-8"));
                                if ((0, common_2.typeofObject)(seeder, (v) => typeof v === "object" && "geography" in v)) {
                                    for (const { filename } of seeder.data) {
                                        const geojson = JSON.parse(await (0, promises_1.readFile)((0, path_1.resolve)(file.parentPath, filename), "utf-8"));
                                        const collection = geojson.features
                                            .filter((feature) => (0, common_2.typeofObject)(feature, (v) => typeof v === "object" && "properties" in v))
                                            .map((feature) => {
                                            const type = `${feature.properties[seeder.geography.mapping.type] ?? seeder.geography.defaults?.type ?? ""}`;
                                            const group = `${feature.properties[seeder.geography.mapping.group] ?? seeder.geography.defaults?.group ?? ""}`;
                                            const name = `${feature.properties[seeder.geography.mapping.name] ?? seeder.geography.defaults?.name ?? ""}`;
                                            const id = feature.properties[seeder.geography.mapping.id]
                                                ? `${feature.properties[seeder.geography.mapping.id]}`
                                                : `${this.normalizer(type)}-${this.normalizer(group)}-${this.normalizer(name)}`;
                                            return {
                                                id,
                                                type,
                                                group,
                                                name,
                                                geojson: feature,
                                            };
                                        });
                                        for (const geographies of (0, lodash_1.chunk)(collection, 100)) {
                                            await this.prismaService.prisma.geography.createMany({
                                                data: geographies,
                                                skipDuplicates: true,
                                            });
                                        }
                                    }
                                }
                                else {
                                    switch (seeder.type) {
                                        case "upsert":
                                            for (const data of seeder.data) {
                                                await this.prismaService.prisma[seeder.table].upsert({
                                                    where: { [seeder.id]: data[seeder.id] },
                                                    update: (0, lodash_1.omit)(data, [seeder.id]),
                                                    create: data,
                                                });
                                            }
                                            break;
                                        case "create":
                                            await this.prismaService.prisma[seeder.table].createMany({
                                                data: seeder.data,
                                                skipDuplicates: true,
                                            });
                                            break;
                                        case "update":
                                            for (const data of seeder.data) {
                                                await this.prismaService.prisma[seeder.table].update({
                                                    where: { [seeder.id]: data[seeder.id] },
                                                    data: (0, lodash_1.omit)(data, [seeder.id]),
                                                });
                                            }
                                            break;
                                        case "delete":
                                            for (const data of seeder.data) {
                                                await this.prismaService.prisma[seeder.table].delete({
                                                    where: { [seeder.id]: data[seeder.id] },
                                                });
                                            }
                                            break;
                                        default:
                                            throw new Error(`Unknown or unsupported seeder type: ${seeder}`);
                                    }
                                }
                                seed.timestamp = metadata.mtime;
                                await this.prismaService.prisma.seed.upsert({
                                    where: { filename: file.name },
                                    create: seed,
                                    update: seed,
                                });
                                seeded.push(seed);
                                this.logger.log(`Finished running seeder ${file.name}.`);
                            }
                            catch (error) {
                                this.logger.warn(error, `Failed to run seeder ${file.name}.`);
                            }
                        }
                    }
                }
            }
            catch (error) {
                this.logger.warn(error);
            }
        }
        if (seeded.length > 0) {
            this.logger.log(`Finished running the database seeder files.`);
        }
        else {
            this.logger.log(`No new database seeder files to run.`);
        }
    }
};
exports.SeedService = SeedService;
__decorate([
    (0, schedule_1.Timeout)(1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SeedService.prototype, "execute", null);
exports.SeedService = SeedService = SeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_1.AppConfigService])
], SeedService);
//# sourceMappingURL=seed.service.js.map