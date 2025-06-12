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
var FileController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileController = void 0;
const common_1 = require("@local/common");
const prisma_service_1 = require("../prisma/prisma.service");
const common_2 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const library_1 = require("@prisma/client/runtime/library");
const roles_decorator_1 = require("../auth/roles.decorator");
const user_decorator_1 = require("../auth/user.decorator");
const swagger_1 = require("@nestjs/swagger");
const app_config_1 = require("../app.config");
const file_1 = require("../utils/file");
require("multer");
async function uploadFile(userId, objectKey, mimeType, contentLength, filePath, buffer, prisma) {
    try {
        await (0, promises_1.writeFile)(filePath, buffer);
        const file = await prisma.file.create({
            data: {
                objectKey,
                mimeType,
                contentLength,
                user: { connect: { id: userId } },
            },
        });
        return file;
    }
    catch (error) {
        if (error instanceof library_1.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                throw new Error("A file with this objectKey already exists.");
            }
            else if (error.code === "P2003") {
                throw new Error("The specified user does not exist.");
            }
        }
        throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function cleanupPartialUploads(fileMetadataIds, filePaths, prisma, logger) {
    const dbPromises = fileMetadataIds.map((id) => prisma.file
        .delete({ where: { id } })
        .catch((error) => logger.error(`Error removing file metadata for ID ${id}:`, error)));
    const fsPromises = filePaths.map((path) => (0, promises_1.unlink)(path).catch((error) => logger.error(`Error removing local file at ${path}:`, error)));
    await Promise.all([...dbPromises, ...fsPromises]);
}
class FilesUploadDto {
    constructor() {
        this.files = [];
    }
}
__decorate([
    (0, swagger_1.ApiProperty)({ type: "array", items: { type: "string", format: "binary" } }),
    __metadata("design:type", Array)
], FilesUploadDto.prototype, "files", void 0);
let FileController = FileController_1 = class FileController {
    constructor(prismaService, configType) {
        this.prismaService = prismaService;
        this.configType = configType;
        this.logger = new common_2.Logger(FileController_1.name);
    }
    async upload(user, res, files) {
        if (files.length === 0) {
            return res
                .status(common_1.HttpStatus.BadRequest.status)
                .json({ ...common_1.HttpStatus.BadRequest, error: "No files were uploaded" });
        }
        const uploadDir = (0, node_path_1.resolve)(process.cwd(), this.configType.file.uploadPath);
        try {
            if (!(0, node_fs_1.existsSync)(uploadDir)) {
                await (0, promises_1.mkdir)(uploadDir, { recursive: true });
            }
        }
        catch (error) {
            this.logger.error("Failed to create local directory", error);
            return res
                .status(common_1.HttpStatus.InternalServerError.status)
                .json({ ...common_1.HttpStatus.InternalServerError, error: "File upload failed" });
        }
        const fsFiles = [];
        const dbFiles = [];
        const ids = [];
        const failed = [];
        for (const file of files) {
            try {
                const bytes = file.buffer;
                const buffer = Buffer.from(bytes);
                const contentLength = buffer.length;
                const fileName = (0, file_1.getObjectKey)({ name: file.filename });
                const filePath = (0, node_path_1.join)(uploadDir, fileName);
                const recordedFile = await uploadFile(user?.id ?? "", fileName, file.mimetype, contentLength, filePath, buffer, this.prismaService.prisma);
                fsFiles.push(fileName);
                dbFiles.push(recordedFile.id);
                ids.push(recordedFile.id);
            }
            catch (error) {
                this.logger.error("Failed to upload file", error);
                failed.push(file.originalname);
            }
        }
        if (failed.length > 0) {
            cleanupPartialUploads(dbFiles, fsFiles.map((f) => (0, node_path_1.join)(uploadDir, f)), this.prismaService.prisma, this.logger).catch((error) => this.logger.error("Failed to clean up partial uploads", error));
        }
        return res.json({ success: ids.length > 0, ids, ...(failed.length > 0 && { failed }) });
    }
    async download(res, id, name) {
        const file = await this.prismaService.prisma.file.findFirst({
            where: { id },
            select: { objectKey: true, mimeType: true },
        });
        if (!file) {
            return res.status(common_1.HttpStatus.NotFound.status).json({ ...common_1.HttpStatus.NotFound, error: "File not found" });
        }
        const filePath = (0, node_path_1.resolve)(process.cwd(), this.configType.file.uploadPath, file.objectKey);
        res.setHeader("Content-Disposition", `attachment; filename=${name}`);
        res.setHeader("Content-Type", file.mimeType);
        return res.sendFile(filePath);
    }
};
exports.FileController = FileController;
__decorate([
    (0, swagger_1.ApiTags)("file", "upload"),
    (0, swagger_1.ApiConsumes)("multipart/form-data"),
    (0, swagger_1.ApiBody)({
        type: FilesUploadDto,
    }),
    (0, roles_decorator_1.Roles)(common_1.RoleType.User),
    (0, common_2.UseInterceptors)((0, platform_express_1.FilesInterceptor)("files")),
    (0, common_2.Post)("upload"),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_2.Res)()),
    __param(2, (0, common_2.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Array]),
    __metadata("design:returntype", Promise)
], FileController.prototype, "upload", null);
__decorate([
    (0, swagger_1.ApiTags)("file", "download"),
    (0, roles_decorator_1.Roles)(common_1.RoleType.User),
    (0, common_2.Get)(":id/download/:name"),
    __param(0, (0, common_2.Res)()),
    __param(1, (0, common_2.Param)("id")),
    __param(2, (0, common_2.Param)("name")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], FileController.prototype, "download", null);
exports.FileController = FileController = FileController_1 = __decorate([
    (0, swagger_1.ApiTags)("file"),
    (0, common_2.Controller)("file"),
    __param(1, (0, common_2.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_1.AppConfigService])
], FileController);
//# sourceMappingURL=file.controller.js.map