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
exports.LocalController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const _1 = require(".");
const user_decorator_1 = require("../user.decorator");
const swagger_1 = require("@nestjs/swagger");
let LocalController = class LocalController {
    async login(req, user) {
        if (user) {
            return new Promise((resolve, reject) => req.logIn(req.user, (err) => (err ? reject(err) : resolve(user))));
        }
        else {
            return null;
        }
    }
};
exports.LocalController = LocalController;
__decorate([
    (0, swagger_1.ApiTags)(_1.Provider, "auth", "login"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)(_1.Provider)),
    (0, common_1.Post)("login"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LocalController.prototype, "login", null);
exports.LocalController = LocalController = __decorate([
    (0, swagger_1.ApiTags)(_1.Provider),
    (0, common_1.Controller)(_1.Provider)
], LocalController);
//# sourceMappingURL=local.controller.js.map