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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const bcrypt_1 = require("@node-rs/bcrypt");
const lodash_1 = require("lodash");
const client_1 = require("@prisma/client");
const auth_1 = require("../auth");
const logging_1 = require("../logging");
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const app_config_1 = require("../app.config");
const processPassword = (password, validate, strength) => {
    const result = (0, auth_1.checkPassword)(password);
    if (validate && result.feedback.warning) {
        throw new Error(result.feedback.warning);
    }
    if (result.score < strength) {
        throw new Error("Password does not meet minimum strength requirements.");
    }
    return (0, bcrypt_1.hashSync)(password, 10);
};
const extendPrisma = (prisma, configService) => {
    return prisma.$extends({
        query: {
            user: {
                $allOperations({ operation, args, query }) {
                    switch (operation) {
                        case "create":
                        case "update":
                            if (typeof args.data.password === "string") {
                                args.data.password = processPassword(args.data.password, configService.password.validate, configService.password.strength);
                            }
                            break;
                        case "upsert":
                            if (typeof args.create.password === "string") {
                                args.create.password = processPassword(args.create.password, configService.password.validate, configService.password.strength);
                            }
                            if (typeof args.update.password === "string") {
                                args.update.password = processPassword(args.update.password, configService.password.validate, configService.password.strength);
                            }
                            break;
                        case "createMany":
                        case "updateMany":
                            if ((0, lodash_1.isArray)(args.data)) {
                                args.data.forEach((v) => {
                                    if (typeof v.password === "string") {
                                        v.password = processPassword(v.password, configService.password.validate, configService.password.strength);
                                    }
                                });
                            }
                            else {
                                if (typeof args.data.password === "string") {
                                    args.data.password = processPassword(args.data.password, configService.password.validate, configService.password.strength);
                                }
                            }
                            break;
                        default:
                    }
                    return query(args);
                },
            },
        },
    });
};
let PrismaService = class PrismaService {
    constructor(configService) {
        this.logger = new common_1.Logger("PrismaClient");
        const level = (0, logging_1.getLogLevel)(configService.log.prisma.level);
        if (level) {
            const prisma = new client_1.PrismaClient({
                log: [
                    {
                        emit: "event",
                        level: "query",
                    },
                ],
            });
            prisma.$on("query", (event) => {
                this.logger[level](event, "Prisma Query");
            });
            this.prisma = extendPrisma(prisma, configService);
        }
        else {
            this.prisma = extendPrisma(new client_1.PrismaClient(), configService);
        }
        this.logger.log(`Prisma Client configured for database at:  ${configService.database.url.split("@").pop()}`);
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_2.Injectable)(),
    __param(0, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map