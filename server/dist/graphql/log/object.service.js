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
exports.LogObject = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
let LogObject = class LogObject {
    constructor(builder) {
        this.LogType = builder.enumType("LogType", {
            values: Object.values(client_1.LogType),
        });
        this.LogObject = builder.prismaObject("Log", {
            authScopes: { admin: true },
            subscribe: (subscriptions, log, _context, _info) => {
                subscriptions.register(`Log/${log.id}`);
            },
            fields: (t) => ({
                id: t.exposeString("id"),
                type: t.expose("type", { type: this.LogType, nullable: true }),
                message: t.exposeString("message", { nullable: true }),
                createdAt: t.expose("createdAt", { type: builder.DateTime }),
                updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
            }),
        });
        this.LogFields = builder.enumType("LogFields", {
            values: Object.values(client_1.Prisma.LogScalarFieldEnum),
        });
    }
};
exports.LogObject = LogObject;
exports.LogObject = LogObject = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosObject)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService])
], LogObject);
//# sourceMappingURL=object.service.js.map