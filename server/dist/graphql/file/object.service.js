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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileObject = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const client_1 = require("@prisma/client");
const pothos_decorator_1 = require("../pothos.decorator");
let FileObject = class FileObject {
    constructor(builder) {
        this.FileObject = builder.prismaObject("File", {
            authScopes: { user: true },
            fields: (t) => ({
                id: t.exposeString("id", { authScopes: { user: true } }),
                mimeType: t.exposeString("mimeType", { authScopes: { user: true } }),
                objectKey: t.exposeString("objectKey", { authScopes: { user: true } }),
                contentLength: t.exposeInt("contentLength", { authScopes: { user: true } }),
                createdAt: t.expose("createdAt", { type: builder.DateTime, authScopes: { user: true } }),
                updatedAt: t.expose("updatedAt", { type: builder.DateTime, authScopes: { user: true } }),
                userId: t.exposeString("userId", { authScopes: { user: true }, nullable: true }),
                feedbackId: t.exposeString("feedbackId", { authScopes: { user: true }, nullable: true }),
                user: t.relation("user", { authScopes: { user: true }, nullable: true }),
                feedback: t.relation("feedback", { authScopes: { user: true }, nullable: true }),
            }),
        });
        this.FileFields = builder.enumType("FileFields", {
            values: Object.values(client_1.Prisma.FileScalarFieldEnum),
        });
    }
};
exports.FileObject = FileObject;
exports.FileObject = FileObject = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosObject)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService])
], FileObject);
//# sourceMappingURL=object.service.js.map